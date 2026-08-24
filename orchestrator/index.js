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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTTP_PORT = process.env.ORCHESTRATOR_PORT || 4000;
const WS_PORT = process.env.WS_PORT || 4001;
const GENERATED_SITE_DIR = path.resolve(__dirname, '../generated-site');

// 1. Initialize Express App
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

// Serve generated-site preview
if (!fs.existsSync(GENERATED_SITE_DIR)) {
  fs.mkdirSync(GENERATED_SITE_DIR, { recursive: true });
}
app.use('/preview', express.static(GENERATED_SITE_DIR));

// 2. Initialize WebSocket Server
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

  // Send initial agent state to connected dashboard
  ws.send(
    JSON.stringify({
      type: 'initial_state',
      agents: stateMachine.getAllStates(),
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
    // Clean up disconnected worker
    for (const [id, worker] of workers.entries()) {
      if (worker.ws === ws) {
        workers.delete(id);
        console.log(`[Worker Hub] Worker disconnected: ${id}`);
      }
    }
    console.log(`[WebSocket Hub] Client disconnected. Total active clients: ${clients.size}`);
  });
});

// 3. Connect StateMachine transitions to WebSocket Broadcast
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

// 4. REST API Routes
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

app.post('/api/build', async (req, res) => {
  const { brief, isMock } = req.body;
  if (!brief) {
    return res.status(400).json({ error: 'Missing "brief" in request body' });
  }

  if (pipelineManager.isRunning) {
    return res.status(409).json({ error: 'Pipeline is currently busy running another build.' });
  }

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

// 5. Start Orchestrator HTTP Server
app.listen(HTTP_PORT, () => {
  console.log(`\n===============================================================`);
  console.log(`  🏢 THE OFFICE - 12-Agent Orchestrator Server Started!         `);
  console.log(`  HTTP API & Live Preview : http://localhost:${HTTP_PORT}`);
  console.log(`  WebSocket Real-Time Hub : ws://localhost:${WS_PORT}`);
  console.log(`  Live Output Directory   : ${GENERATED_SITE_DIR}`);
  console.log(`===============================================================\n`);
});
