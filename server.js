/**
 * server.js — Full-Stack 12BOT Socket.io Execution Engine & Backend
 * Port: 4000
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PORT = process.env.PORT || 4000;
const GENERATED_SITE_DIR = path.join(__dirname, 'generated-site');

// Ensure generated-site folder exists
if (!fs.existsSync(GENERATED_SITE_DIR)) fs.mkdirSync(GENERATED_SITE_DIR, { recursive: true });

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

// Root route - so localhost:4000 doesn't show "Cannot GET /"
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: '12BOT Engine Running on port 4000', preview: 'http://localhost:4000/preview' });
});

// Health & Status check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    tokensRemaining,
    agents: AGENTS.map(({ id, name, role, state, message, currentX, currentY }) => ({
      id, name, role, state, message, currentX, currentY,
    })),
  });
});

// ─── /api/build — Generate a website from a brief ────────────────────────────
app.post('/api/build', (req, res) => {
  const { brief = 'Build a portfolio website' } = req.body || {};
  console.log(`\n\x1b[36m[Build] Received brief: "${brief}"\x1b[0m`);

  // Detect niche from brief
  const nicheLower = brief.toLowerCase();
  let niche = 'Website';
  if (nicheLower.includes('[app]'))       niche = 'App';
  else if (nicheLower.includes('[dashboard]')) niche = 'Dashboard';
  else if (nicheLower.includes('[game]'))      niche = 'Game';

  const themes = {
    App:       { bg: '#0a0f1e', accent: '#6366f1', title: 'Habit Tracker App' },
    Website:   { bg: '#070d1a', accent: '#00d4ff', title: 'LUMEN Portfolio' },
    Dashboard: { bg: '#060d10', accent: '#10b981', title: 'Analytics Dashboard' },
    Game:      { bg: '#0a050f', accent: '#bf5fff', title: 'Retro Arcade Game' },
  };
  const theme = themes[niche] || themes['Website'];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${theme.title} — Built by 12BOT</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: ${theme.bg};
      color: #e2e8f0;
      min-height: 100vh;
      overflow-x: hidden;
    }
    /* Animated gradient bg */
    body::before {
      content: '';
      position: fixed; inset: 0;
      background: radial-gradient(ellipse at 20% 20%, ${theme.accent}22 0%, transparent 60%),
                  radial-gradient(ellipse at 80% 80%, ${theme.accent}11 0%, transparent 60%);
      pointer-events: none; z-index: 0;
      animation: bgPulse 8s infinite alternate;
    }
    @keyframes bgPulse {
      from { opacity: 0.6; } to { opacity: 1; }
    }
    nav {
      position: sticky; top: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 40px;
      background: rgba(0,0,0,0.7);
      border-bottom: 1px solid ${theme.accent}44;
      backdrop-filter: blur(12px);
      z-index: 100;
    }
    .nav-logo { font-weight: 800; font-size: 1.2rem; color: ${theme.accent}; letter-spacing: 1px; }
    .nav-links a {
      color: #94a3b8; text-decoration: none; margin-left: 28px;
      font-size: 0.9rem; font-weight: 500;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: ${theme.accent}; }
    .hero {
      min-height: 90vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center; padding: 40px 20px;
      position: relative; z-index: 1;
    }
    .hero-badge {
      display: inline-block; margin-bottom: 20px;
      padding: 4px 16px; border-radius: 20px;
      border: 1px solid ${theme.accent}66;
      color: ${theme.accent}; font-size: 0.75rem; font-weight: 600;
      letter-spacing: 2px; text-transform: uppercase;
      background: ${theme.accent}11;
    }
    .hero h1 {
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 800; line-height: 1.1;
      background: linear-gradient(135deg, #ffffff 0%, ${theme.accent} 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
    }
    .hero p {
      max-width: 600px; color: #94a3b8; font-size: 1.1rem;
      line-height: 1.7; margin-bottom: 36px;
    }
    .btn-group { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
    .btn-primary {
      padding: 14px 32px; border-radius: 8px; font-weight: 700;
      font-size: 0.95rem; cursor: pointer; border: none;
      background: ${theme.accent}; color: #000;
      box-shadow: 0 0 30px ${theme.accent}55;
      transition: all 0.2s;
    }
    .btn-primary:hover { filter: brightness(1.2); transform: translateY(-2px); }
    .btn-ghost {
      padding: 14px 32px; border-radius: 8px; font-weight: 600;
      font-size: 0.95rem; cursor: pointer;
      background: transparent; color: ${theme.accent};
      border: 1px solid ${theme.accent}66;
      transition: all 0.2s;
    }
    .btn-ghost:hover { background: ${theme.accent}11; }
    .cards {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px; padding: 60px 40px; max-width: 1200px; margin: 0 auto;
      position: relative; z-index: 1;
    }
    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid ${theme.accent}22;
      border-radius: 16px; padding: 28px;
      transition: all 0.3s;
      animation: cardIn 0.6s ease both;
    }
    .card:hover { border-color: ${theme.accent}66; transform: translateY(-4px); box-shadow: 0 10px 40px ${theme.accent}22; }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .card:nth-child(2) { animation-delay: 0.1s; }
    .card:nth-child(3) { animation-delay: 0.2s; }
    .card-icon { font-size: 2rem; margin-bottom: 14px; }
    .card h3 { font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .card p  { font-size: 0.88rem; color: #64748b; line-height: 1.6; }
    footer {
      text-align: center; padding: 40px; color: #334155;
      font-size: 0.8rem; border-top: 1px solid #1e293b;
      position: relative; z-index: 1;
    }
    footer span { color: ${theme.accent}; }
  </style>
</head>
<body>
  <nav>
    <div class="nav-logo">${theme.title}</div>
    <div class="nav-links">
      <a href="#">Home</a>
      <a href="#">Work</a>
      <a href="#">About</a>
      <a href="#">Contact</a>
    </div>
  </nav>

  <section class="hero">
    <div class="hero-badge">Built by 12BOT AI Dev Team</div>
    <h1>${theme.title}</h1>
    <p>${brief.replace(/^\[[^\]]+\]\s*/, '')}</p>
    <div class="btn-group">
      <button class="btn-primary">Get Started →</button>
      <button class="btn-ghost">View Demo</button>
    </div>
  </section>

  <div class="cards">
    <div class="card">
      <div class="card-icon">⚡</div>
      <h3>Lightning Fast</h3>
      <p>Optimized build pipeline delivering sub-second load times with zero configuration needed.</p>
    </div>
    <div class="card">
      <div class="card-icon">🎨</div>
      <h3>Pixel-Perfect Design</h3>
      <p>Every element crafted by the UI/UX agent with a consistent dark design system and neon accents.</p>
    </div>
    <div class="card">
      <div class="card-icon">🤖</div>
      <h3>AI-Generated Code</h3>
      <p>12 specialized LLM agents collaborated to produce this fully structured, production-ready site.</p>
    </div>
  </div>

  <footer>
    <p>Generated in 5.8 seconds by <span>12BOT AI Dev Team</span> — All 12 agents deployed ✓</p>
  </footer>

  <script>
    // Subtle parallax on hero
    document.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      document.querySelector('.hero h1').style.transform = 'translate(' + x * 0.3 + 'px,' + y * 0.3 + 'px)';
    });
  </script>
</body>
</html>`;

  // Write to generated-site/index.html
  fs.writeFileSync(path.join(GENERATED_SITE_DIR, 'index.html'), html, 'utf8');
  console.log(`\x1b[32m[Build] Site written to generated-site/index.html\x1b[0m`);

  // Broadcast build complete to all sockets
  io.emit('build_complete', { previewUrl: 'http://localhost:4000/preview', niche });

  res.json({ success: true, previewUrl: 'http://localhost:4000/preview', niche, brief });
});

// Serve the generated website at /preview
app.use('/preview', express.static(GENERATED_SITE_DIR, { index: 'index.html' }));

// Download the complete generated site as a .ZIP archive
app.get('/api/download', (req, res) => {
  if (!fs.existsSync(GENERATED_SITE_DIR)) {
    return res.status(404).json({ error: 'No site generated yet' });
  }

  res.attachment('12bot-generated-project.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);
  archive.directory(GENERATED_SITE_DIR, false);
  archive.finalize();
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
