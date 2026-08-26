import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { agentLoader } from './agentLoader.js';
import { stateMachine } from './stateMachine.js';
import { pipelineManager } from './pipeline.js';
import { fallbackManager } from './fallback.js';
import { tokenTracker } from './tokenTracker.js';
import { deploy, lastDeployResult } from './deployer.js';
import { getAllAgentStats, isChainEnabled } from './chainClient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTTP_PORT = process.env.ORCHESTRATOR_PORT || 4000;
const WS_PORT = process.env.WS_PORT || 4001;
const GENERATED_SITE_DIR = path.resolve(__dirname, '../generated-site');

// ─── 1. Initialize Express App ────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Enable CORS for dashboard access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve generated-site preview (existing local preview on /preview path)
if (!fs.existsSync(GENERATED_SITE_DIR)) {
  fs.mkdirSync(GENERATED_SITE_DIR, { recursive: true });
}
app.use('/preview', express.static(GENERATED_SITE_DIR));

// ─── 2. Initialize WebSocket Server ──────────────────────────────────────────
const wss = new WebSocketServer({ port: Number(WS_PORT) });
const clients = new Set();
const workers = new Map(); // machineId -> { ws, roles }

function broadcast(data) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`\x1b[34m[WebSocket Hub] Client connected. Total active clients: ${clients.size}\x1b[0m`);

  // Send initial agent state + token snapshot + deploy/chain status to newly connected dashboard
  ws.send(
    JSON.stringify({
      type: 'initial_state',
      agents: stateMachine.getAllStates(),
      tokenSnapshot: tokenTracker.getAll(),
      chainEnabled: isChainEnabled(),
      deployStatus: lastDeployResult,
      timestamp: new Date().toISOString(),
    })
  );

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.type === 'worker_register') {
        const { machineId, roles } = data;
        workers.set(machineId, { ws, roles: roles || [] });
        console.log(`\x1b[32m[Worker Hub] Registered worker: "${machineId}" for roles: [${(roles || []).join(', ')}]\x1b[0m`);
      }
    } catch (e) {
      console.error('[WebSocket Hub] Error parsing client message:', e.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    for (const [id, worker] of workers.entries()) {
      if (worker.ws === ws) {
        workers.delete(id);
        console.log(`[Worker Hub] Worker disconnected: ${id}`);
      }
    }
    console.log(`[WebSocket Hub] Client disconnected. Total active clients: ${clients.size}`);
  });
});

// ─── 3. StateMachine → WebSocket Bridge ──────────────────────────────────────

// Agent state transitions
stateMachine.on('agent:transition', ({ agentId, from, to, state }) => {
  broadcast({
    type: 'agent_status',
    agentId,
    name: state.name,
    status: to,
    previousStatus: from,
    currentTask: state.currentTask,
    timestamp: new Date().toISOString(),
  });
});

// Feature 1: Token usage updates
stateMachine.on('agent:tokens', ({ agentId, delta, cumulative, taskId }) => {
  broadcast({
    type: 'token_update',
    agentId,
    delta,
    cumulative,
    taskId,
    grandTotal: tokenTracker.getGrandTotal(),
    timestamp: new Date().toISOString(),
  });
});

// Mirror tokenTracker → stateMachine so both stay in sync
tokenTracker.on('tokens:updated', ({ agentId, delta, cumulative, taskId }) => {
  // stateMachine.recordTokens already fired from pipeline; this ensures
  // any direct tokenTracker.record() calls also update stateMachine stats
  const state = stateMachine.getState(agentId);
  if (state && state.stats.tokensUsed !== cumulative) {
    state.stats.tokensUsed = cumulative;
  }
});

// ─── 4. Economy broadcast (polling every 30s when chain is enabled) ──────────
if (isChainEnabled()) {
  setInterval(async () => {
    try {
      const agentStats = await getAllAgentStats();
      broadcast({
        type: 'economy_update',
        agents: agentStats,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Economy] Failed to fetch agent stats:', err.message);
    }
  }, 30_000);
}

// ─── 5. REST API Routes ───────────────────────────────────────────────────────

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    agents: stateMachine.getAllStates(),
    workers: Array.from(workers.keys()),
  });
});

app.get('/api/agents', (req, res) => {
  res.json(agentLoader.getAllAgents());
});

app.get('/api/files', (req, res) => {
  if (!fs.existsSync(GENERATED_SITE_DIR)) {
    return res.json([]);
  }
  const files = fs.readdirSync(GENERATED_SITE_DIR);
  res.json(files);
});

// Feature 1: Token usage snapshot
app.get('/api/tokens', (req, res) => {
  res.json({
    tokens: tokenTracker.getAll(),
    grandTotal: tokenTracker.getGrandTotal(),
    timestamp: new Date().toISOString(),
  });
});

// Feature 2: Human override — reroute a task from one agent to another
app.post('/api/reroute', async (req, res) => {
  const { fromAgentId, toAgentId, taskId } = req.body;

  if (!fromAgentId || !toAgentId) {
    return res.status(400).json({ error: 'fromAgentId and toAgentId are required.' });
  }
  if (fromAgentId === toAgentId) {
    return res.status(400).json({ error: 'fromAgentId and toAgentId must be different.' });
  }

  const fromStatus = stateMachine.getAgentStatus(fromAgentId);
  if (!fromStatus) {
    return res.status(404).json({ error: `Agent "${fromAgentId}" not found.` });
  }

  if (!pipelineManager.isRunning) {
    return res.status(409).json({ error: 'No pipeline is currently running. Nothing to reroute.' });
  }

  console.log(`\x1b[33m[Human Override] Rerouting task from ${fromAgentId} → ${toAgentId}\x1b[0m`);

  try {
    // Reuse the existing fallback logic (same path as quota-exhaustion)
    const result = await pipelineManager.rerouteTask(fromAgentId, toAgentId);

    broadcast({
      type: 'agent_rerouted',
      fromAgentId,
      toAgentId,
      taskId: result?.taskId || taskId,
      trigger: 'human_override',
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      fromAgentId,
      toAgentId,
      taskId: result?.taskId,
    });
  } catch (err) {
    console.error('[Human Override] Reroute failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Feature 3: Deploy status
app.get('/api/deploy-status', (req, res) => {
  res.json(lastDeployResult || { url: null, provider: null, timestamp: null });
});

// Feature 4: Agent economy (on-chain stats)
app.get('/api/economy', async (req, res) => {
  try {
    const agentStats = await getAllAgentStats();
    res.json({
      chainEnabled: isChainEnabled(),
      agents: agentStats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 6. Build Pipeline Route ──────────────────────────────────────────────────
app.post('/api/build', async (req, res) => {
  const { brief, isMock } = req.body;
  if (!brief) {
    return res.status(400).json({ error: 'Missing "brief" in request body' });
  }

  if (pipelineManager.isRunning) {
    return res.status(409).json({ error: 'Pipeline is currently busy running another build.' });
  }

  // Reset token tracker at the start of each new build
  tokenTracker.reset();

  broadcast({
    type: 'pipeline_started',
    brief,
    timestamp: new Date().toISOString(),
  });

  res.json({ status: 'started', brief });

  // Run pipeline asynchronously
  try {
    const result = await pipelineManager.runPipeline(brief, isMock !== false);

    broadcast({
      type: 'pipeline_finished',
      status: 'completed',
      result,
      timestamp: new Date().toISOString(),
    });

    // Feature 3: Auto-deploy after pipeline completion
    console.log('\n[Deployer] Pipeline complete — triggering deploy...');
    const deployResult = await deploy(GENERATED_SITE_DIR);
    broadcast({
      type: 'deploy_ready',
      url: deployResult.url,
      provider: deployResult.provider,
      timestamp: deployResult.timestamp,
    });
    console.log(`[Deployer] Live URL: ${deployResult.url} (${deployResult.provider})`);

    // Feature 4: Broadcast final economy state after pipeline (if chain is enabled)
    if (isChainEnabled()) {
      const agentStats = await getAllAgentStats();
      broadcast({
        type: 'economy_update',
        agents: agentStats,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Pipeline Execution Error:', err);
    broadcast({
      type: 'pipeline_finished',
      status: 'failed',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── 7. Start Orchestrator HTTP Server ───────────────────────────────────────
app.listen(HTTP_PORT, () => {
  console.log(`\n===============================================================`);
  console.log(`  🏢 THE OFFICE - 12-Agent Orchestrator Server Started!         `);
  console.log(`  HTTP API & Live Preview : http://localhost:${HTTP_PORT}`);
  console.log(`  WebSocket Real-Time Hub : ws://localhost:${WS_PORT}`);
  console.log(`  Live Output Directory   : ${GENERATED_SITE_DIR}`);
  console.log(`  Chain Features          : ${isChainEnabled() ? '✅ ENABLED (Base Sepolia)' : '⏸ DISABLED (set CHAIN_ENABLED=true)'}`);
  console.log(`===============================================================\n`);
});
