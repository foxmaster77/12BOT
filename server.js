/**
 * server.js — Full-Stack 12BOT Socket.io Execution Engine & Backend
 * Port: 4000
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Initialize Express App & HTTP Server
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);

// Initialize Socket.io with full CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ─── Global State ─────────────────────────────────────────────────────────────

let tokensRemaining = 500;

// 6 Primary Workstation Desks (Isometric 2-Row x 3-Col Layout)
const AGENTS = [
  {
    id: 'agent_1',
    name: 'Dev 1 - Architect',
    role: 'Lead System Architect',
    color: '#38bdf8',
    state: 'IDLE',
    message: 'System Idle',
    deskX: 18,
    deskY: 32,
    currentX: 18,
    currentY: 32,
    logs: ['Initialized agent workspace.', 'Standing by for workflow requests.'],
  },
  {
    id: 'agent_2',
    name: 'Dev 2 - Frontend',
    role: 'UI/UX & React Engineer',
    color: '#818cf8',
    state: 'IDLE',
    message: 'System Idle',
    deskX: 42,
    deskY: 32,
    currentX: 42,
    currentY: 32,
    logs: ['Initialized frontend runtime.', 'Standing by for design specs.'],
  },
  {
    id: 'agent_3',
    name: 'Dev 3 - Backend',
    role: 'API & Microservices Dev',
    color: '#34d399',
    state: 'IDLE',
    message: 'System Idle',
    deskX: 66,
    deskY: 32,
    currentX: 66,
    currentY: 32,
    logs: ['Initialized Express cluster.', 'Ready for endpoint routing.'],
  },
  {
    id: 'agent_4',
    name: 'Dev 4 - Database',
    role: 'Database & Schema Setup',
    color: '#fbbf24',
    state: 'IDLE',
    message: 'System Idle',
    deskX: 18,
    deskY: 65,
    currentX: 18,
    currentY: 65,
    logs: ['SQLite connection ready.', 'Standing by for migration scripts.'],
  },
  {
    id: 'agent_5',
    name: 'Dev 5 - Animator',
    role: 'Motion & FX Engineer',
    color: '#fb923c',
    state: 'IDLE',
    message: 'System Idle',
    deskX: 42,
    deskY: 65,
    currentX: 42,
    currentY: 65,
    logs: ['Canvas & CSS pipeline active.', 'Ready for keyframe sequencing.'],
  },
  {
    id: 'agent_6',
    name: 'Dev 6 - QA/Review',
    role: 'Debugger & Verifier',
    color: '#f472b6',
    state: 'IDLE',
    message: 'System Idle',
    deskX: 66,
    deskY: 65,
    currentX: 66,
    currentY: 65,
    logs: ['Test suite loaded.', 'Standing by for verification pass.'],
  },
];

// ─── REST Endpoints ───────────────────────────────────────────────────────────

// Health & Status check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    tokensRemaining,
    agents: AGENTS.map(({ id, name, role, state, message, currentX, currentY }) => ({
      id,
      name,
      role,
      state,
      message,
      currentX,
      currentY,
    })),
  });
});

// Top-up tokens back to 500
app.post('/api/recharge', (req, res) => {
  tokensRemaining = 500;
  console.log(`\x1b[32m[Token Recharge] Tokens reset to ${tokensRemaining}\x1b[0m`);

  // Broadcast new token budget to all connected sockets
  io.emit('token_update', { tokensRemaining });

  // Reset any agents in OUT_OF_TOKENS state
  AGENTS.forEach((agent) => {
    if (agent.state === 'OUT_OF_TOKENS') {
      agent.state = 'IDLE';
      agent.message = 'System Idle';
      agent.currentX = agent.deskX;
      agent.currentY = agent.deskY;
      agent.logs.push(`[${new Date().toLocaleTimeString()}] Tokens recharged. Resumed IDLE.`);
      io.emit('agent_status', {
        agentId: agent.id,
        state: agent.state,
        message: agent.message,
        currentX: agent.currentX,
        currentY: agent.currentY,
      });
    }
  });

  res.json({ success: true, tokensRemaining });
});

// ─── Socket.io State Machine & Workflow Orchestration ────────────────────────

io.on('connection', (socket) => {
  console.log(`\x1b[34m[Socket.io] Client connected: ${socket.id}\x1b[0m`);

  // Send initial snapshot
  socket.send?.(
    JSON.stringify({
      type: 'initial_state',
      tokensRemaining,
      agents: AGENTS,
    })
  );
  socket.emit('initial_state', {
    tokensRemaining,
    agents: AGENTS,
  });

  // Client triggers token recharge
  socket.on('recharge_tokens', () => {
    tokensRemaining = 500;
    io.emit('token_update', { tokensRemaining });
  });

  // Main 12BOT workflow execution event
  socket.on('run_bot_task', ({ agentId = 'agent_1', prompt = 'Generate Web Module' }) => {
    console.log(`\n\x1b[36m[Workflow Trigger] Agent: ${agentId} | Prompt: "${prompt}"\x1b[0m`);

    const agent = AGENTS.find((a) => a.id === agentId) || AGENTS[0];

    // 1. Check Token Budget
    if (tokensRemaining <= 0) {
      console.warn(`\x1b[31m[Token Error] Insufficient tokens for ${agent.id}\x1b[0m`);
      agent.state = 'OUT_OF_TOKENS';
      agent.message = 'Tokens Exhausted!';
      agent.logs.push(`[${new Date().toLocaleTimeString()}] ERROR: Tokens exhausted while requesting: "${prompt}"`);

      io.emit('agent_status', {
        agentId: agent.id,
        state: 'OUT_OF_TOKENS',
        message: 'Tokens Exhausted!',
        currentX: agent.currentX,
        currentY: agent.currentY,
      });

      io.emit('task_log', {
        agentId: agent.id,
        log: 'Tokens Exhausted! Please recharge (+500) to proceed.',
        error: true,
      });
      return;
    }

    // 2. Deduct 50 tokens and broadcast active TYPING state
    tokensRemaining = Math.max(0, tokensRemaining - 50);
    agent.state = 'TYPING';
    agent.message = 'Executing 12BOT Workflow...';
    agent.currentX = agent.deskX;
    agent.currentY = agent.deskY;
    agent.logs.push(`[${new Date().toLocaleTimeString()}] Task assigned (-50 tokens): "${prompt}"`);

    io.emit('token_update', { tokensRemaining });
    io.emit('agent_status', {
      agentId: agent.id,
      state: 'TYPING',
      message: 'Executing 12BOT Workflow...',
      currentX: agent.deskX,
      currentY: agent.deskY,
    });
    io.emit('task_log', {
      agentId: agent.id,
      log: `Active execution started for prompt: "${prompt}"`,
    });

    // 3. AFTER 3 seconds: Transition to WALKING towards Coffee Bar (X: 82%, Y: 15%)
    setTimeout(() => {
      agent.state = 'WALKING';
      agent.currentX = 82;
      agent.currentY = 15;
      agent.message = 'Heading to Coffee Bar...';
      agent.logs.push(`[${new Date().toLocaleTimeString()}] Task phase completed. Walking to Coffee Bar.`);

      io.emit('agent_status', {
        agentId: agent.id,
        state: 'WALKING',
        targetState: 'WALKING_TO_COFFEE',
        message: 'Heading to Coffee Bar...',
        currentX: 82,
        currentY: 15,
      });
      io.emit('task_log', {
        agentId: agent.id,
        log: 'Phase 1 code compilation complete. Taking coffee break.',
      });

      // 4. AFTER 2 seconds (Walk time): Arrived at Coffee Station -> DRINKING_COFFEE
      setTimeout(() => {
        agent.state = 'DRINKING_COFFEE';
        agent.currentX = 82;
        agent.currentY = 15;
        agent.message = 'Coffee Break...';
        agent.logs.push(`[${new Date().toLocaleTimeString()}] Sipping coffee at station.`);

        io.emit('agent_status', {
          agentId: agent.id,
          state: 'DRINKING_COFFEE',
          message: 'Coffee Break...',
          currentX: 82,
          currentY: 15,
        });
        io.emit('task_log', {
          agentId: agent.id,
          log: 'Sipping espresso at coffee bar.',
        });

        // 5. AFTER 3 seconds (Sip time): Transition to WALKING back to desk
        setTimeout(() => {
          agent.state = 'WALKING';
          agent.currentX = agent.deskX;
          agent.currentY = agent.deskY;
          agent.message = 'Returning to desk...';
          agent.logs.push(`[${new Date().toLocaleTimeString()}] Finished coffee. Walking back to workstation.`);

          io.emit('agent_status', {
            agentId: agent.id,
            state: 'WALKING',
            targetState: 'WALKING_TO_DESK',
            message: 'Returning to desk...',
            currentX: agent.deskX,
            currentY: agent.deskY,
          });
          io.emit('task_log', {
            agentId: agent.id,
            log: 'Returning to workstation for final verification pass.',
          });

          // 6. AFTER 2 seconds (Walk back): Arrived at Desk -> IDLE / DONE
          setTimeout(() => {
            agent.state = 'IDLE';
            agent.currentX = agent.deskX;
            agent.currentY = agent.deskY;
            agent.message = 'System Idle';
            agent.logs.push(`[${new Date().toLocaleTimeString()}] Workflow fully completed and verified.`);

            io.emit('agent_status', {
              agentId: agent.id,
              state: 'IDLE',
              message: 'System Idle',
              currentX: agent.deskX,
              currentY: agent.deskY,
            });
            io.emit('task_log', {
              agentId: agent.id,
              log: 'Workflow execution cycle successfully finished.',
            });
          }, 2000);
        }, 3000);
      }, 2000);
    }, 3000);
  });

  socket.on('disconnect', () => {
    console.log(`\x1b[33m[Socket.io] Client disconnected: ${socket.id}\x1b[0m`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`\n===============================================================`);
  console.log(`  🎮 12BOT SOCKET.IO SERVER RUNNING ON PORT ${PORT}              `);
  console.log(`  WebSocket Endpoint : ws://localhost:${PORT}`);
  console.log(`  REST API Status    : http://localhost:${PORT}/api/status`);
  console.log(`  Token Recharge     : POST http://localhost:${PORT}/api/recharge`);
  console.log(`===============================================================\n`);
});
