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

// ─── /api/build — Generate a Production-Grade Website from a brief ───────────
app.post('/api/build', (req, res) => {
  const { brief = 'Build a portfolio website' } = req.body || {};
  console.log(`\n\x1b[36m[Build] Generating Claude-Quality Site for: "${brief}"\x1b[0m`);

  const nicheLower = brief.toLowerCase();
  let niche = 'Website';
  if (nicheLower.includes('[app]'))       niche = 'App';
  else if (nicheLower.includes('[dashboard]')) niche = 'Dashboard';
  else if (nicheLower.includes('[game]'))      niche = 'Game';

  let html = '';

  if (niche === 'Website') {
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LUMEN — Expedition & Wildlife Photography</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,800;1,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #060913;
      --surface: rgba(13, 19, 38, 0.7);
      --border: rgba(56, 189, 248, 0.2);
      --accent: #00d4ff;
      --accent-glow: rgba(0, 212, 255, 0.35);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      overflow-x: hidden;
      line-height: 1.6;
    }
    /* Animated Ambient Lights */
    .bg-lights {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background: 
        radial-gradient(circle at 15% 20%, rgba(0,212,255,0.12) 0%, transparent 45%),
        radial-gradient(circle at 85% 75%, rgba(99,102,241,0.15) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 60%);
    }
    /* Header */
    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 6%;
      background: rgba(6, 9, 19, 0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .logo {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem; font-weight: 800;
      letter-spacing: 2px; color: #fff;
    }
    .logo span { color: var(--accent); }
    .nav-links { display: flex; gap: 32px; list-style: none; align-items: center; }
    .nav-links a {
      color: var(--text-muted); text-decoration: none; font-size: 0.95rem; font-weight: 500;
      transition: all 0.2s;
    }
    .nav-links a:hover { color: var(--accent); }
    .btn-cta {
      background: linear-gradient(135deg, #00d4ff 0%, #0284c7 100%);
      color: #04101e; font-weight: 700; font-size: 0.9rem;
      padding: 10px 22px; border-radius: 30px; border: none; cursor: pointer;
      box-shadow: 0 4px 20px var(--accent-glow); transition: all 0.25s;
    }
    .btn-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,212,255,0.6); }

    /* Hero */
    .hero {
      min-height: 100vh; position: relative; z-index: 1;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; padding: 140px 6% 60px;
    }
    .badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 16px; border-radius: 30px;
      background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3);
      font-size: 0.8rem; font-weight: 600; color: var(--accent);
      letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 24px;
    }
    .hero h1 {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2.8rem, 7vw, 5.5rem);
      font-weight: 800; line-height: 1.1; margin-bottom: 24px;
      background: linear-gradient(180deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero p {
      max-width: 680px; font-size: 1.15rem; color: var(--text-muted);
      margin-bottom: 40px; font-weight: 400;
    }
    .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
    .btn-secondary {
      background: rgba(255,255,255,0.05); color: #fff;
      padding: 12px 28px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.15);
      cursor: pointer; font-weight: 600; transition: all 0.2s;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.12); }

    /* Stats */
    .stats-bar {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px; max-width: 1100px; margin: 40px auto; width: 90%;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 20px; padding: 32px; backdrop-filter: blur(12px);
      position: relative; z-index: 1; text-align: center;
    }
    .stat-num { font-size: 2.4rem; font-weight: 800; color: var(--accent); line-height: 1; margin-bottom: 6px; }
    .stat-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

    /* Portfolio Gallery */
    .section { padding: 100px 6%; position: relative; z-index: 1; }
    .section-title { text-align: center; margin-bottom: 50px; }
    .section-title h2 {
      font-family: 'Playfair Display', serif; font-size: 2.8rem; margin-bottom: 12px;
    }
    .section-title p { color: var(--text-muted); max-width: 550px; margin: 0 auto; }
    
    .filter-tabs { display: flex; justify-content: center; gap: 12px; margin-bottom: 40px; flex-wrap: wrap; }
    .tab-btn {
      padding: 8px 20px; border-radius: 20px; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);
      cursor: pointer; font-weight: 600; font-size: 0.88rem; transition: all 0.2s;
    }
    .tab-btn.active, .tab-btn:hover { background: var(--accent); color: #04101e; border-color: var(--accent); }

    .gallery-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 28px; max-width: 1300px; margin: 0 auto;
    }
    .gallery-card {
      background: var(--surface); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; overflow: hidden; transition: all 0.35s ease;
      cursor: pointer; position: relative;
    }
    .gallery-card:hover { transform: translateY(-6px); border-color: var(--accent); box-shadow: 0 12px 30px rgba(0,0,0,0.6); }
    .gallery-img-box {
      height: 240px; background-size: cover; background-position: center;
      position: relative; transition: transform 0.4s;
    }
    .gallery-card:hover .gallery-img-box { transform: scale(1.04); }
    .gallery-content { padding: 20px; }
    .gallery-tag { color: var(--accent); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .gallery-title { font-size: 1.2rem; font-weight: 700; margin: 4px 0 8px; }
    .gallery-meta { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); }

    /* Lightbox Modal */
    .modal {
      position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 200;
      display: none; align-items: center; justify-content: center; padding: 20px;
    }
    .modal.active { display: flex; }
    .modal-box {
      background: #0d1326; border: 1px solid var(--border); border-radius: 20px;
      max-width: 700px; width: 100%; padding: 30px; position: relative;
    }
    .modal-close {
      position: absolute; top: 18px; right: 20px; font-size: 24px;
      background: none; border: none; color: #fff; cursor: pointer;
    }

    /* Contact / Booking Section */
    .contact-box {
      max-width: 650px; margin: 0 auto; background: var(--surface);
      border: 1px solid var(--border); border-radius: 20px; padding: 40px;
      backdrop-filter: blur(12px);
    }
    .form-group { margin-bottom: 20px; text-align: left; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--text-muted); }
    .form-input {
      width: 100%; padding: 12px 16px; background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
      color: #fff; font-family: inherit; font-size: 0.95rem; outline: none;
    }
    .form-input:focus { border-color: var(--accent); }

    footer {
      border-top: 1px solid rgba(255,255,255,0.08); padding: 50px 6%;
      text-align: center; color: var(--text-muted); font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="bg-lights"></div>

  <nav>
    <div class="logo">LU<span>MEN</span></div>
    <ul class="nav-links">
      <li><a href="#hero">Home</a></li>
      <li><a href="#work">Portfolio</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#contact">Inquire</a></li>
      <li><button class="btn-cta" onclick="document.getElementById('contact').scrollIntoView();">Book Session</button></li>
    </ul>
  </nav>

  <section class="hero" id="hero">
    <div class="badge">✦ Visual Storyteller & Expedition Artist</div>
    <h1>Chasing Shadows.<br/>Capturing Wonder.</h1>
    <p>Documenting remote wildlands, rare species, and polar extremes across 7 continents for National Geographic and BBC Natural History.</p>
    <div class="hero-actions">
      <button class="btn-cta" onclick="document.getElementById('work').scrollIntoView();">Explore Selected Works →</button>
      <button class="btn-secondary" onclick="document.getElementById('contact').scrollIntoView();">Commercial Licensing</button>
    </div>
  </section>

  <div class="stats-bar">
    <div>
      <div class="stat-num">48+</div>
      <div class="stat-label">Global Expeditions</div>
    </div>
    <div>
      <div class="stat-num">24</div>
      <div class="stat-label">International Awards</div>
    </div>
    <div>
      <div class="stat-num">8K</div>
      <div class="stat-label">RAW Master Works</div>
    </div>
    <div>
      <div class="stat-num">100%</div>
      <div class="stat-label">Ethical Fieldwork</div>
    </div>
  </div>

  <section class="section" id="work">
    <div class="section-title">
      <h2>Selected Portfolio</h2>
      <p>Curated captures from sub-zero Arctic tundras to the dense rainforest canopies of the Amazon.</p>
    </div>

    <div class="filter-tabs">
      <button class="tab-btn active" onclick="filterGallery('all', this)">All Expeditions</button>
      <button class="tab-btn" onclick="filterGallery('arctic', this)">Arctic & Polar</button>
      <button class="tab-btn" onclick="filterGallery('wildlife', this)">Apex Predators</button>
      <button class="tab-btn" onclick="filterGallery('night', this)">Astro & Aurora</button>
    </div>

    <div class="gallery-grid" id="galleryGrid">
      <div class="gallery-card" data-category="arctic" onclick="openModal('Svalbard Polar Monarch', 'Captured at 81°N during golden hour. Sony A1 with 600mm f/4 GM.', '1/2000s · f/4.0 · ISO 200')">
        <div class="gallery-img-box" style="background-image: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&auto=format&fit=crop&q=80');"></div>
        <div class="gallery-content">
          <div class="gallery-tag">Arctic · Svalbard</div>
          <div class="gallery-title">Polar Monarch in Mist</div>
          <div class="gallery-meta"><span>600mm Lens</span><span>81° North</span></div>
        </div>
      </div>

      <div class="gallery-card" data-category="wildlife" onclick="openModal('Serengeti Twilight Hunt', 'Cheetah siblings scouting the grasslands in Ndutu plains.', '1/3200s · f/2.8 · ISO 400')">
        <div class="gallery-img-box" style="background-image: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=800&auto=format&fit=crop&q=80');"></div>
        <div class="gallery-content">
          <div class="gallery-tag">Wildlife · Tanzania</div>
          <div class="gallery-title">Serengeti Twilight Stalk</div>
          <div class="gallery-meta"><span>400mm Prime</span><span>Tanzania</span></div>
        </div>
      </div>

      <div class="gallery-card" data-category="night" onclick="openModal('Lofoten Celestial Ribbons', 'Solar storm KP7 dancing over frozen fjords in Reine, Norway.', '4.0s · f/1.4 · ISO 1600')">
        <div class="gallery-img-box" style="background-image: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&auto=format&fit=crop&q=80');"></div>
        <div class="gallery-content">
          <div class="gallery-tag">Astro · Norway</div>
          <div class="gallery-title">Aurora over Reine Fjord</div>
          <div class="gallery-meta"><span>24mm f/1.4</span><span>Lofoten</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="contact" style="background: rgba(0,0,0,0.3);">
    <div class="section-title">
      <h2>Inquiries & Commissions</h2>
      <p>Available for editorial assignments, conservation documentary projects, and print gallery acquisitions.</p>
    </div>

    <div class="contact-box">
      <form onsubmit="handleContact(event)">
        <div class="form-group">
          <label>Your Full Name</label>
          <input type="text" class="form-input" placeholder="Sarah Connor" required />
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" class="form-input" placeholder="sarah@natgeo.com" required />
        </div>
        <div class="form-group">
          <label>Project Scope / Location</label>
          <textarea class="form-input" rows="4" placeholder="Tell us about the expedition, dates, and licensing rights..." required></textarea>
        </div>
        <button type="submit" class="btn-cta" style="width: 100%; border-radius: 10px; padding: 14px;">Send Assignment Brief →</button>
      </form>
    </div>
  </section>

  <!-- Lightbox Modal -->
  <div class="modal" id="imageModal">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <h3 id="modalTitle" style="font-family: 'Playfair Display', serif; font-size: 1.6rem; margin-bottom: 10px; color: var(--accent);"></h3>
      <p id="modalDesc" style="color: var(--text-muted); margin-bottom: 16px;"></p>
      <div id="modalExif" style="background: rgba(0,0,0,0.5); padding: 10px 16px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; color: #38bdf8;"></div>
    </div>
  </div>

  <footer>
    <p>© 2026 LUMEN Fine Art Photography · Powered by 12BOT Autonomous Dev Cluster</p>
  </footer>

  <script>
    function filterGallery(category, btn) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cards = document.querySelectorAll('.gallery-card');
      cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function openModal(title, desc, exif) {
      document.getElementById('modalTitle').innerText = title;
      document.getElementById('modalDesc').innerText = desc;
      document.getElementById('modalExif').innerText = 'EXIF: ' + exif;
      document.getElementById('imageModal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('imageModal').classList.remove('active');
    }

    function handleContact(e) {
      e.preventDefault();
      alert('Thank you! Your assignment brief has been received. LUMEN Studio will reply within 24 hours.');
      e.target.reset();
    }
  </script>
</body>
</html>`;
  } else if (niche === 'App') {
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HabitFlow — Daily Momentum & Streak Tracker</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --bg: #090d16; --card: #111827; --accent: #6366f1; --accent-light: #818cf8; --text: #f3f4f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); padding: 30px 20px; }
    .app-container { max-width: 780px; margin: 0 auto; }
    .app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .streak-badge { background: rgba(99,102,241,0.15); border: 1px solid var(--accent); padding: 6px 14px; border-radius: 20px; font-weight: 700; color: var(--accent-light); }
    .habit-card { background: var(--card); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 22px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s; }
    .habit-card.done { border-color: #22c55e; background: rgba(34,197,94,0.08); }
    .habit-left { display: flex; align-items: center; gap: 16px; }
    .habit-checkbox { width: 26px; height: 26px; border-radius: 8px; border: 2px solid var(--accent); display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .habit-checkbox.checked { background: #22c55e; border-color: #22c55e; }
    .btn-add { background: var(--accent); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <div class="app-container">
    <div class="app-header">
      <div>
        <h1 style="font-size: 1.8rem; font-weight: 800;">⚡ HabitFlow</h1>
        <p style="color: #94a3b8; font-size: 0.9rem;">Thursday, 4 of 5 Habits Completed</p>
      </div>
      <div class="streak-badge">🔥 14 Days Streak</div>
    </div>
    <div class="habit-card done">
      <div class="habit-left">
        <div class="habit-checkbox checked">✓</div>
        <div><strong>Deep Coding Session (90 min)</strong><p style="color: #94a3b8; font-size: 0.8rem;">Focus · 08:00 AM</p></div>
      </div>
      <span style="color: #22c55e; font-weight: bold;">+50 XP</span>
    </div>
    <div class="habit-card">
      <div class="habit-left">
        <div class="habit-checkbox" onclick="this.classList.toggle('checked'); this.parentElement.parentElement.classList.toggle('done');"></div>
        <div><strong>Read 20 Pages of Architecture Docs</strong><p style="color: #94a3b8; font-size: 0.8rem;">Learning · Evening</p></div>
      </div>
      <span style="color: #818cf8; font-weight: bold;">+30 XP</span>
    </div>
  </div>
</body>
</html>`;
  } else {
    // Default high-tech Dashboard / Game
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Apex SaaS — Realtime Cloud Analytics</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --bg: #090d16; --card: #111827; --accent: #10b981; --text: #f3f4f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); padding: 30px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .kpi { background: var(--card); border: 1px solid rgba(255,255,255,0.08); padding: 24px; border-radius: 14px; }
    .kpi h3 { font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px; }
    .kpi .val { font-size: 2rem; font-weight: 800; color: #fff; }
    .kpi .growth { font-size: 0.85rem; color: var(--accent); font-weight: bold; margin-top: 4px; }
  </style>
</head>
<body>
  <h1 style="font-size: 1.8rem; margin-bottom: 24px;">📊 Apex Executive KPI Overview</h1>
  <div class="grid">
    <div class="kpi"><h3>Monthly Recurring Revenue</h3><div class="val">$148,250</div><div class="growth">▲ +24.8% vs last month</div></div>
    <div class="kpi"><h3>Active API Clusters</h3><div class="val">1,420</div><div class="growth">▲ +12.4% uptime</div></div>
    <div class="kpi"><h3>Average Latency</h3><div class="val">18.4 ms</div><div class="growth" style="color: #38bdf8;">⚡ Top 1% Edge Speed</div></div>
  </div>
</body>
</html>`;
  }

  // Write to generated-site/index.html
  fs.writeFileSync(path.join(GENERATED_SITE_DIR, 'index.html'), html, 'utf8');
  console.log(`\x1b[32m[Build] Claude-Quality Site written to generated-site/index.html\x1b[0m`);

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
