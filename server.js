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
  <title>HabitFlow — Daily Momentum & Habit Operating System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070b14;
      --sidebar: #0b1220;
      --card: #0f172a;
      --card-hover: #1e293b;
      --accent: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.35);
      --green: #10b981;
      --green-glow: rgba(16, 185, 129, 0.3);
      --orange: #f59e0b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: rgba(255, 255, 255, 0.08);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      min-height: 100vh;
      overflow-x: hidden;
    }
    /* App Sidebar */
    aside {
      width: 260px;
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      padding: 24px 18px;
      display: flex;
      flex-direction: column;
      gap: 28px;
      flex-shrink: 0;
    }
    .brand {
      display: flex; align-items: center; gap: 10px;
      font-size: 1.25rem; font-weight: 800; color: #fff;
    }
    .brand-icon {
      width: 34px; height: 34px; border-radius: 8px;
      background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 14px var(--accent-glow);
    }
    .nav-group { display: flex; flex-direction: column; gap: 4px; }
    .nav-label { font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; padding-left: 8px; }
    .nav-link {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 10px;
      color: var(--text-muted); text-decoration: none; font-size: 0.9rem; font-weight: 600;
      transition: all 0.15s;
    }
    .nav-link:hover { background: rgba(255,255,255,0.04); color: #fff; }
    .nav-link.active { background: rgba(99,102,241,0.15); color: var(--accent); border: 1px solid rgba(99,102,241,0.3); }
    .user-profile {
      margin-top: auto; padding: 12px; border-radius: 12px;
      background: rgba(255,255,255,0.03); border: 1px solid var(--border);
      display: flex; align-items: center; gap: 12px;
    }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
      display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;
    }

    /* Main Area */
    main {
      flex: 1; padding: 32px 40px; overflow-y: auto; max-width: 1200px;
    }
    .top-bar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 32px; flex-wrap: wrap; gap: 16px;
    }
    .top-bar h1 { font-size: 1.85rem; font-weight: 800; }
    .top-bar p { color: var(--text-muted); font-size: 0.95rem; margin-top: 2px; }
    .top-actions { display: flex; align-items: center; gap: 14px; }
    .btn-add {
      background: linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%);
      color: #fff; font-family: inherit; font-weight: 700; font-size: 0.9rem;
      padding: 11px 22px; border-radius: 10px; border: none; cursor: pointer;
      box-shadow: 0 4px 16px var(--accent-glow); transition: all 0.2s;
    }
    .btn-add:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.6); }

    /* Overview Cards */
    .overview-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px; margin-bottom: 32px;
    }
    .ov-card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 22px; position: relative;
    }
    .ov-title { font-size: 0.82rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .ov-val { font-size: 2.1rem; font-weight: 800; margin: 8px 0 4px; line-height: 1; }
    .ov-sub { font-size: 0.82rem; color: var(--green); font-weight: 600; }

    /* Habit List */
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 18px;
    }
    .section-header h2 { font-size: 1.25rem; font-weight: 700; }
    .habits-container { display: flex; flex-direction: column; gap: 12px; margin-bottom: 36px; }
    .habit-card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 18px 22px;
      display: flex; align-items: center; justify-content: space-between;
      transition: all 0.2s ease; cursor: pointer;
    }
    .habit-card:hover { border-color: rgba(99,102,241,0.4); transform: translateX(3px); }
    .habit-card.completed {
      background: rgba(16, 185, 129, 0.06);
      border-color: rgba(16, 185, 129, 0.35);
    }
    .habit-left { display: flex; align-items: center; gap: 18px; }
    .custom-check {
      width: 28px; height: 28px; border-radius: 8px;
      border: 2px solid #475569; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; font-size: 14px; font-weight: 900;
    }
    .habit-card.completed .custom-check {
      background: var(--green); border-color: var(--green);
      color: #000; box-shadow: 0 0 10px var(--green-glow);
    }
    .habit-name { font-size: 1.05rem; font-weight: 700; transition: color 0.2s; }
    .habit-card.completed .habit-name { text-decoration: line-through; color: var(--text-muted); }
    .habit-tag {
      display: inline-block; font-size: 0.72rem; font-weight: 700;
      padding: 2px 8px; border-radius: 6px; background: rgba(255,255,255,0.06);
      color: var(--text-muted); margin-top: 4px;
    }
    .habit-right { display: flex; align-items: center; gap: 20px; }
    .streak-pill {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.85rem; font-weight: 700; color: var(--orange);
    }
    .xp-pill {
      font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700;
      color: #818cf8; background: rgba(99,102,241,0.12);
      padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(99,102,241,0.25);
    }
    .del-btn {
      background: none; border: none; color: #475569; cursor: pointer;
      font-size: 16px; transition: color 0.15s; padding: 4px;
    }
    .del-btn:hover { color: #ef4444; }

    /* Weekly Heatmap Matrix */
    .heatmap-card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 24px; margin-bottom: 30px;
    }
    .heatmap-grid {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; margin-top: 16px; text-align: center;
    }
    .day-col { display: flex; flex-direction: column; gap: 8px; align-items: center; }
    .day-name { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
    .day-box {
      width: 100%; height: 38px; border-radius: 8px;
      background: rgba(255,255,255,0.04); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 700; color: var(--text-muted);
    }
    .day-box.active {
      background: rgba(16, 185, 129, 0.2); border-color: var(--green); color: var(--green);
    }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
      display: none; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-backdrop.open { display: flex; }
    .modal-card {
      background: #0d1527; border: 1px solid rgba(99,102,241,0.3); border-radius: 16px;
      width: 460px; max-width: 90vw; padding: 28px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    }
    .modal-card h3 { font-size: 1.3rem; margin-bottom: 18px; font-weight: 800; }
    .form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-muted); }
    .form-input {
      padding: 10px 14px; background: rgba(0,0,0,0.4); border: 1px solid var(--border);
      border-radius: 8px; color: #fff; font-family: inherit; font-size: 0.9rem; outline: none;
    }
    .form-input:focus { border-color: var(--accent); }
    .modal-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
    .btn-cancel { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 9px 18px; border-radius: 8px; cursor: pointer; font-family: inherit; font-weight: 600; }
  </style>
</head>
<body>
  <aside>
    <div class="brand">
      <div class="brand-icon">⚡</div>
      <span>HabitFlow</span>
    </div>
    <div class="nav-group">
      <div class="nav-label">Workspace</div>
      <a href="#" class="nav-link active">📅 Today's Focus</a>
      <a href="#" class="nav-link">🔥 Streaks & XP</a>
      <a href="#" class="nav-link">📊 Analytics Hub</a>
      <a href="#" class="nav-link">🎯 Goal Quests</a>
    </div>
    <div class="nav-group">
      <div class="nav-label">Categories</div>
      <a href="#" class="nav-link">💻 Deep Coding</a>
      <a href="#" class="nav-link">🧘 Mindfulness</a>
      <a href="#" class="nav-link">🏃 Athletics</a>
    </div>
    <div class="user-profile">
      <div class="user-avatar">JD</div>
      <div>
        <div style="font-size: 0.85rem; font-weight: 700;">Alex Mercer</div>
        <div style="font-size: 0.72rem; color: var(--accent); font-weight: 600;">Level 14 Adept</div>
      </div>
    </div>
  </aside>

  <main>
    <div class="top-bar">
      <div>
        <h1>Daily Momentum</h1>
        <p>Keep your active daily streak going. Consistency compounds into mastery.</p>
      </div>
      <div class="top-actions">
        <button class="btn-add" onclick="openAddModal()">+ Add New Habit</button>
      </div>
    </div>

    <div class="overview-grid">
      <div class="ov-card">
        <div class="ov-title">Completion Rate</div>
        <div class="ov-val" id="compRate">83%</div>
        <div class="ov-sub">▲ 5 of 6 Habits Completed</div>
      </div>
      <div class="ov-card">
        <div class="ov-title">Current Active Streak</div>
        <div class="ov-val" style="color: var(--orange);">🔥 18 Days</div>
        <div class="ov-sub">Personal Best: 24 Days</div>
      </div>
      <div class="ov-card">
        <div class="ov-title">Total XP Earned</div>
        <div class="ov-val" style="color: #818cf8;" id="totalXp">2,450 XP</div>
        <div class="ov-sub">Level 15 unlocked in 150 XP</div>
      </div>
    </div>

    <!-- Weekly Heatmap -->
    <div class="heatmap-card">
      <div class="section-header">
        <h2>Weekly Consistency Matrix</h2>
        <span style="font-size: 0.8rem; color: var(--text-muted);">October 2026</span>
      </div>
      <div class="heatmap-grid">
        <div class="day-col"><span class="day-name">MON</span><div class="day-box active">✓ 6/6</div></div>
        <div class="day-col"><span class="day-name">TUE</span><div class="day-box active">✓ 6/6</div></div>
        <div class="day-col"><span class="day-name">WED</span><div class="day-box active">✓ 5/6</div></div>
        <div class="day-col"><span class="day-name">THU</span><div class="day-box active">✓ 6/6</div></div>
        <div class="day-col"><span class="day-name">FRI</span><div class="day-box active">✓ 6/6</div></div>
        <div class="day-col"><span class="day-name">SAT</span><div class="day-box active">✓ 4/6</div></div>
        <div class="day-col"><span class="day-name">SUN</span><div class="day-box active">✓ 5/6</div></div>
      </div>
    </div>

    <!-- Habits List -->
    <div class="section-header">
      <h2>Today's Habits</h2>
      <span style="font-size: 0.85rem; color: var(--text-muted);" id="completedCount">5 of 6 Completed</span>
    </div>

    <div class="habits-container" id="habitsList">
      <div class="habit-card completed" onclick="toggleHabit(this, 50)">
        <div class="habit-left">
          <div class="custom-check">✓</div>
          <div>
            <div class="habit-name">Deep Focus Coding (90 Mins)</div>
            <span class="habit-tag">Deep Work · 08:00 AM</span>
          </div>
        </div>
        <div class="habit-right">
          <div class="streak-pill">🔥 18d</div>
          <div class="xp-pill">+50 XP</div>
          <button class="del-btn" onclick="deleteHabit(event, this)">✕</button>
        </div>
      </div>

      <div class="habit-card completed" onclick="toggleHabit(this, 30)">
        <div class="habit-left">
          <div class="custom-check">✓</div>
          <div>
            <div class="habit-name">Review Distributed Systems Paper</div>
            <span class="habit-tag">Learning · 10:30 AM</span>
          </div>
        </div>
        <div class="habit-right">
          <div class="streak-pill">🔥 14d</div>
          <div class="xp-pill">+30 XP</div>
          <button class="del-btn" onclick="deleteHabit(event, this)">✕</button>
        </div>
      </div>

      <div class="habit-card completed" onclick="toggleHabit(this, 40)">
        <div class="habit-left">
          <div class="custom-check">✓</div>
          <div>
            <div class="habit-name">5KM Zone-2 Aerobic Run</div>
            <span class="habit-tag">Health · 05:30 PM</span>
          </div>
        </div>
        <div class="habit-right">
          <div class="streak-pill">🔥 9d</div>
          <div class="xp-pill">+40 XP</div>
          <button class="del-btn" onclick="deleteHabit(event, this)">✕</button>
        </div>
      </div>

      <div class="habit-card completed" onclick="toggleHabit(this, 25)">
        <div class="habit-left">
          <div class="custom-check">✓</div>
          <div>
            <div class="habit-name">Hydration Target (3.5 Liters)</div>
            <span class="habit-tag">Wellness · All Day</span>
          </div>
        </div>
        <div class="habit-right">
          <div class="streak-pill">🔥 24d</div>
          <div class="xp-pill">+25 XP</div>
          <button class="del-btn" onclick="deleteHabit(event, this)">✕</button>
        </div>
      </div>

      <div class="habit-card completed" onclick="toggleHabit(this, 20)">
        <div class="habit-left">
          <div class="custom-check">✓</div>
          <div>
            <div class="habit-name">Evening Reflection & Journaling</div>
            <span class="habit-tag">Mindset · 09:30 PM</span>
          </div>
        </div>
        <div class="habit-right">
          <div class="streak-pill">🔥 12d</div>
          <div class="xp-pill">+20 XP</div>
          <button class="del-btn" onclick="deleteHabit(event, this)">✕</button>
        </div>
      </div>

      <div class="habit-card" onclick="toggleHabit(this, 35)">
        <div class="habit-left">
          <div class="custom-check"></div>
          <div>
            <div class="habit-name">Read 20 Pages of System Design Book</div>
            <span class="habit-tag">Growth · 10:00 PM</span>
          </div>
        </div>
        <div class="habit-right">
          <div class="streak-pill">🔥 5d</div>
          <div class="xp-pill">+35 XP</div>
          <button class="del-btn" onclick="deleteHabit(event, this)">✕</button>
        </div>
      </div>
    </div>
  </main>

  <!-- Add Habit Modal -->
  <div class="modal-backdrop" id="addModal">
    <div class="modal-card">
      <h3>+ Create New Habit</h3>
      <form onsubmit="submitNewHabit(event)">
        <div class="form-group">
          <label>Habit Name</label>
          <input type="text" id="habitTitleInput" class="form-input" placeholder="e.g. 15 Mins Meditation" required />
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="habitCategoryInput" class="form-input">
            <option>Deep Work</option>
            <option>Health & Fitness</option>
            <option>Learning & Growth</option>
            <option>Mindset</option>
          </select>
        </div>
        <div class="form-group">
          <label>XP Reward</label>
          <input type="number" id="habitXpInput" class="form-input" value="30" min="10" max="100" />
        </div>
        <div class="modal-btns">
          <button type="button" class="btn-cancel" onclick="closeAddModal()">Cancel</button>
          <button type="submit" class="btn-add">Save Habit</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let currentXp = 2450;

    function toggleHabit(card, xp) {
      const isDone = card.classList.toggle('completed');
      const check = card.querySelector('.custom-check');
      check.innerText = isDone ? '✓' : '';
      currentXp += isDone ? xp : -xp;
      document.getElementById('totalXp').innerText = currentXp.toLocaleString() + ' XP';
      updateStats();
    }

    function deleteHabit(e, btn) {
      e.stopPropagation();
      const card = btn.closest('.habit-card');
      card.remove();
      updateStats();
    }

    function updateStats() {
      const total = document.querySelectorAll('.habit-card').length;
      const done = document.querySelectorAll('.habit-card.completed').length;
      const pct = total === 0 ? 100 : Math.round((done / total) * 100);
      document.getElementById('compRate').innerText = pct + '%';
      document.getElementById('completedCount').innerText = done + ' of ' + total + ' Completed';
    }

    function openAddModal() {
      document.getElementById('addModal').classList.add('open');
    }
    function closeAddModal() {
      document.getElementById('addModal').classList.remove('open');
    }

    function submitNewHabit(e) {
      e.preventDefault();
      const title = document.getElementById('habitTitleInput').value;
      const cat = document.getElementById('habitCategoryInput').value;
      const xp = parseInt(document.getElementById('habitXpInput').value) || 30;

      const card = document.createElement('div');
      card.className = 'habit-card';
      card.onclick = function() { toggleHabit(this, xp); };
      card.innerHTML = \`
        <div class="habit-left">
          <div class="custom-check"></div>
          <div>
            <div class="habit-name">\${title}</div>
            <span class="habit-tag">\${cat} · Anytime</span>
          </div>
        </div>
        <div class="habit-right">
          <div class="streak-pill">🔥 1d</div>
          <div class="xp-pill">+\${xp} XP</div>
          <button class="del-btn" onclick="deleteHabit(event, this)">✕</button>
        </div>
      \`;

      document.getElementById('habitsList').prepend(card);
      closeAddModal();
      e.target.reset();
      updateStats();
    }
  </script>
</body>
</html>`;
  } else if (niche === 'Dashboard') {
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Apex Cloud — Enterprise Cluster & Revenue Telemetry</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070a13;
      --sidebar: #0b101d;
      --card: #0f1627;
      --border: rgba(255, 255, 255, 0.08);
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.3);
      --green: #10b981;
      --purple: #a855f7;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      min-height: 100vh;
      overflow-x: hidden;
    }
    /* Sidebar */
    aside {
      width: 250px; background: var(--sidebar); border-right: 1px solid var(--border);
      padding: 24px 16px; display: flex; flex-direction: column; gap: 28px; flex-shrink: 0;
    }
    .logo-box { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.15rem; color: #fff; }
    .logo-icon {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, #0284c7 0%, var(--accent) 100%);
      display: flex; align-items: center; justify-content: center; font-weight: 900;
    }
    .nav-list { display: flex; flex-direction: column; gap: 4px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 9px 12px;
      border-radius: 8px; color: var(--text-muted); font-size: 0.88rem; font-weight: 600;
      text-decoration: none; transition: all 0.15s;
    }
    .nav-item:hover { background: rgba(255,255,255,0.04); color: #fff; }
    .nav-item.active { background: rgba(56,189,248,0.12); color: var(--accent); border: 1px solid rgba(56,189,248,0.3); }

    /* Content Area */
    main { flex: 1; padding: 28px 36px; overflow-y: auto; max-width: 1300px; }
    .top-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 28px; flex-wrap: wrap; gap: 14px;
    }
    .title-group h1 { font-size: 1.75rem; font-weight: 800; }
    .title-group p { color: var(--text-muted); font-size: 0.9rem; margin-top: 2px; }
    .header-controls { display: flex; align-items: center; gap: 12px; }
    .status-badge {
      display: flex; align-items: center; gap: 6px;
      background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3);
      padding: 6px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; color: var(--green);
    }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }
    .btn-export {
      background: rgba(255,255,255,0.06); border: 1px solid var(--border);
      color: #fff; font-family: inherit; font-size: 0.85rem; font-weight: 600;
      padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
    }
    .btn-export:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }

    /* KPI Grid */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px; margin-bottom: 28px;
    }
    .kpi-box {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 20px; position: relative;
    }
    .kpi-label { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-num { font-size: 2rem; font-weight: 800; margin: 8px 0 6px; line-height: 1; }
    .kpi-trend { font-size: 0.82rem; font-weight: 700; color: var(--green); display: flex; align-items: center; gap: 4px; }

    /* Analytics Chart Card */
    .chart-card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 24px; margin-bottom: 28px;
    }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .chart-header h2 { font-size: 1.15rem; font-weight: 700; }
    .time-tabs { display: flex; gap: 6px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 8px; border: 1px solid var(--border); }
    .time-btn {
      background: transparent; border: none; color: var(--text-muted); font-size: 0.75rem; font-weight: 700;
      padding: 5px 12px; border-radius: 6px; cursor: pointer; transition: all 0.15s;
    }
    .time-btn.active, .time-btn:hover { background: var(--accent); color: #000; }

    /* SVG Wave Chart */
    .chart-svg { width: 100%; height: 220px; overflow: visible; }

    /* Cluster Map & Logs Grid */
    .grid-2col {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px;
    }
    @media (max-width: 950px) { .grid-2col { grid-template-columns: 1fr; } }
    .panel-card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 22px;
    }
    .panel-card h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 16px; }

    .cluster-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .cluster-item:last-child { border-bottom: none; }
    .cluster-info { font-weight: 600; font-size: 0.9rem; }
    .cluster-region { font-size: 0.75rem; color: var(--text-muted); }
    .load-bar {
      width: 100px; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;
    }
    .load-fill { height: 100%; border-radius: 3px; background: var(--accent); }

    /* Live Requests Table */
    .table-box {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 22px; overflow-x: auto;
    }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
    .data-table th { padding: 12px 14px; color: var(--text-muted); font-weight: 700; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }
    .badge-method { padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 0.72rem; }
    .badge-get { background: rgba(56,189,248,0.15); color: #38bdf8; }
    .badge-post { background: rgba(16,185,129,0.15); color: #10b981; }
    .badge-put { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .badge-status { padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 0.72rem; background: rgba(16,185,129,0.15); color: #10b981; }
  </style>
</head>
<body>
  <aside>
    <div class="logo-box">
      <div class="logo-icon">▲</div>
      <span>APEX CLOUD</span>
    </div>
    <div class="nav-list">
      <a href="#" class="nav-item active">📊 Overview</a>
      <a href="#" class="nav-item">⚡ Edge Clusters</a>
      <a href="#" class="nav-item">🌐 Traffic Stream</a>
      <a href="#" class="nav-item">🔒 Security & WAF</a>
      <a href="#" class="nav-item">💳 Billing & Usage</a>
      <a href="#" class="nav-item">⚙️ Settings</a>
    </div>
  </aside>

  <main>
    <div class="top-header">
      <div class="title-group">
        <h1>Global Cluster Overview</h1>
        <p>Live telemetry across 14 edge regions and 1,420 microservice nodes.</p>
      </div>
      <div class="header-controls">
        <div class="status-badge">
          <span class="status-dot"></span>
          <span>99.98% All Systems Operational</span>
        </div>
        <button class="btn-export" onclick="alert('Exporting cluster telemetry CSV...')">⬇ Export CSV</button>
      </div>
    </div>

    <!-- 4 KPI Hero Stats -->
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Monthly Recurring Revenue</div>
        <div class="kpi-num" style="color: #fff;">$248,500</div>
        <div class="kpi-trend">▲ +24.8% vs last cycle</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Global Request Rate</div>
        <div class="kpi-num" style="color: var(--accent);">42.8M</div>
        <div class="kpi-trend">▲ +18.2% peak throughput</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Average Edge Latency</div>
        <div class="kpi-num" style="color: var(--green);">18.4 ms</div>
        <div class="kpi-trend" style="color: #38bdf8;">⚡ Top 1% CDN Performance</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Active Container Nodes</div>
        <div class="kpi-num" style="color: var(--purple);">1,420</div>
        <div class="kpi-trend">✓ 0 degraded instances</div>
      </div>
    </div>

    <!-- Interactive Wave Chart -->
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <h2>Throughput & Ingestion Rate</h2>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Real-time ingress requests per second</span>
        </div>
        <div class="time-tabs">
          <button class="time-btn" onclick="switchTime(this)">1H</button>
          <button class="time-btn active" onclick="switchTime(this)">24H</button>
          <button class="time-btn" onclick="switchTime(this)">7D</button>
          <button class="time-btn" onclick="switchTime(this)">30D</button>
        </div>
      </div>

      <svg class="chart-svg" viewBox="0 0 800 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <!-- Background Grid Lines -->
        <line x1="0" y1="40" x2="800" y2="40" stroke="rgba(255,255,255,0.05)" />
        <line x1="0" y1="90" x2="800" y2="90" stroke="rgba(255,255,255,0.05)" />
        <line x1="0" y1="140" x2="800" y2="140" stroke="rgba(255,255,255,0.05)" />
        
        <!-- Fill Area -->
        <path d="M0,160 Q100,60 200,110 T400,70 T600,90 T800,40 L800,200 L0,200 Z" fill="url(#chartGrad)" />
        <!-- Stroke Line -->
        <path d="M0,160 Q100,60 200,110 T400,70 T600,90 T800,40" fill="none" stroke="#38bdf8" stroke-width="3" />
      </svg>
    </div>

    <!-- Cluster Nodes & Traffic Breakdown -->
    <div class="grid-2col">
      <div class="panel-card">
        <h3>Edge Cluster Load</h3>
        <div class="cluster-item">
          <div>
            <div class="cluster-info">us-east-1 (N. Virginia)</div>
            <div class="cluster-region">580 Nodes · 99.99%</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent);">42% Load</div>
            <div class="load-bar"><div class="load-fill" style="width: 42%;"></div></div>
          </div>
        </div>
        <div class="cluster-item">
          <div>
            <div class="cluster-info">eu-central-1 (Frankfurt)</div>
            <div class="cluster-region">440 Nodes · 99.98%</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--green);">68% Load</div>
            <div class="load-bar"><div class="load-fill" style="width: 68%; background: var(--green);"></div></div>
          </div>
        </div>
        <div class="cluster-item">
          <div>
            <div class="cluster-info">ap-south-1 (Singapore)</div>
            <div class="cluster-region">400 Nodes · 100.0%</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--purple);">55% Load</div>
            <div class="load-bar"><div class="load-fill" style="width: 55%; background: var(--purple);"></div></div>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <h3>Incident & Health Stream</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.82rem; font-family: 'JetBrains Mono', monospace;">
          <div style="padding: 10px; border-radius: 8px; background: rgba(16,185,129,0.08); border-left: 3px solid var(--green);">
            <strong style="color: var(--green);">[HEALTHY]</strong> AP-South auto-scaled +40 worker pods.
          </div>
          <div style="padding: 10px; border-radius: 8px; background: rgba(56,189,248,0.08); border-left: 3px solid var(--accent);">
            <strong style="color: var(--accent);">[DEPLOY]</strong> v2.4.1 rolled out across EU clusters seamlessly.
          </div>
          <div style="padding: 10px; border-radius: 8px; background: rgba(245,158,11,0.08); border-left: 3px solid #f59e0b;">
            <strong style="color: #f59e0b);">[INFO]</strong> SSL certificates renewed automatically for 18 domains.
          </div>
        </div>
      </div>
    </div>

    <!-- Live Requests Table -->
    <div class="table-box">
      <div class="chart-header">
        <h3>Live Request Stream</h3>
        <span style="font-size: 0.78rem; color: var(--accent);">● Realtime 100 req/s</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>METHOD</th>
            <th>ENDPOINT</th>
            <th>STATUS</th>
            <th>LATENCY</th>
            <th>CLIENT IP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="badge-method badge-get">GET</span></td>
            <td>/api/v2/telemetry/nodes</td>
            <td><span class="badge-status">200 OK</span></td>
            <td>12.4 ms</td>
            <td>142.250.190.46</td>
          </tr>
          <tr>
            <td><span class="badge-method badge-post">POST</span></td>
            <td>/api/v2/clusters/scale</td>
            <td><span class="badge-status">201 CREATED</span></td>
            <td>24.8 ms</td>
            <td>104.244.42.1</td>
          </tr>
          <tr>
            <td><span class="badge-method badge-get">GET</span></td>
            <td>/api/v1/auth/session-token</td>
            <td><span class="badge-status">200 OK</span></td>
            <td>8.2 ms</td>
            <td>172.217.16.206</td>
          </tr>
          <tr>
            <td><span class="badge-method badge-put">PUT</span></td>
            <td>/api/v2/config/rate-limits</td>
            <td><span class="badge-status">200 OK</span></td>
            <td>19.6 ms</td>
            <td>198.51.100.24</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <script>
    function switchTime(btn) {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  </script>
</body>
</html>`;
  } else {
    // ── GAME: Complete 16-Bit CyberStrike Arcade Game ──
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CyberStrike 16-Bit — Retro Space Defender</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Orbitron:wght@600;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #03060f;
      color: #fff;
      font-family: 'Press Start 2P', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      user-select: none;
    }
    .arcade-wrapper {
      position: relative;
      background: #090e1c;
      border: 3px solid #00d4ff;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 0 30px rgba(0, 212, 255, 0.4), inset 0 0 20px rgba(0,0,0,0.8);
      max-width: 960px;
      width: 95vw;
    }
    .arcade-hud {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: #040711;
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 0.65rem;
      color: #38bdf8;
    }
    .hud-item { display: flex; align-items: center; gap: 8px; }
    .hud-val { color: #facc15; font-weight: bold; }
    canvas {
      display: block;
      width: 100%;
      background: #000;
      border-radius: 8px;
      border: 1px solid rgba(56, 189, 248, 0.2);
      image-rendering: pixelated;
    }
    .arcade-controls-guide {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.55rem;
      color: #64748b;
      padding: 4px 8px;
    }
    .key-badge {
      background: #1e293b; color: #38bdf8; padding: 3px 6px; border-radius: 4px; border: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="arcade-wrapper">
    <div class="arcade-hud">
      <div class="hud-item">SCORE: <span class="hud-val" id="scoreDisplay">00000</span></div>
      <div class="hud-item">WAVE: <span class="hud-val" id="waveDisplay">1</span></div>
      <div class="hud-item">SHIELD: <span class="hud-val" id="shieldDisplay" style="color: #4ade80;">100%</span></div>
      <div class="hud-item">HIGH: <span class="hud-val" id="highDisplay">12,500</span></div>
    </div>

    <canvas id="gameCanvas" width="800" height="480"></canvas>

    <div class="arcade-controls-guide">
      <div>[ <span class="key-badge">◄</span> <span class="key-badge">►</span> or <span class="key-badge">A</span> <span class="key-badge">D</span> ] Move Ship</div>
      <div>[ <span class="key-badge">SPACE</span> or <span class="key-badge">CLICK</span> ] Fire Lasers</div>
      <div>[ <span class="key-badge">P</span> ] Pause</div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let score = 0;
    let wave = 1;
    let shield = 100;
    let highScore = localStorage.getItem('cyber_high') || 12500;
    document.getElementById('highDisplay').innerText = highScore;

    let gameOver = false;
    let gameStarted = false;

    // Player Ship
    const player = {
      x: 375,
      y: 410,
      w: 40,
      h: 30,
      speed: 6,
      vx: 0,
      shootCooldown: 0,
    };

    const keys = {};
    window.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (!gameStarted) { gameStarted = true; loop(); }
      if (gameOver && e.code === 'Space') restartGame();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });

    // Touch & Mouse Support
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      player.x = (e.clientX - rect.left) * scaleX - player.w / 2;
    });
    canvas.addEventListener('mousedown', () => {
      if (!gameStarted) { gameStarted = true; loop(); }
      else if (gameOver) restartGame();
      else shootLaser();
    });

    const lasers = [];
    const enemies = [];
    const particles = [];
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 480,
      speed: Math.random() * 2 + 0.5,
      size: Math.random() * 2 + 1,
    }));

    function spawnWave() {
      enemies.length = 0;
      const rows = 3;
      const cols = 8;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          enemies.push({
            x: 100 + c * 75,
            y: 40 + r * 45,
            w: 32,
            h: 24,
            vx: 1.5 + wave * 0.3,
            color: r === 0 ? '#ef4444' : r === 1 ? '#a855f7' : '#00d4ff',
            hp: r === 0 ? 2 : 1,
          });
        }
      }
    }
    spawnWave();

    function shootLaser() {
      if (player.shootCooldown > 0 || gameOver) return;
      lasers.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 14, vy: -9 });
      player.shootCooldown = 12;
    }

    function createExplosion(x, y, color) {
      for (let i = 0; i < 16; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 25,
          color,
        });
      }
    }

    function update() {
      if (gameOver) return;

      // Move player with keys
      if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
      if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
      if (keys['Space']) shootLaser();

      player.x = Math.max(10, Math.min(800 - player.w - 10, player.x));
      if (player.shootCooldown > 0) player.shootCooldown--;

      // Move Stars
      stars.forEach(s => {
        s.y += s.speed;
        if (s.y > 480) { s.y = 0; s.x = Math.random() * 800; }
      });

      // Move Lasers
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.y += l.vy;
        if (l.y < 0) lasers.splice(i, 1);
      }

      // Move Enemies
      let changeDir = false;
      enemies.forEach(e => {
        e.x += e.vx;
        if (e.x + e.w > 790 || e.x < 10) changeDir = true;
      });

      if (changeDir) {
        enemies.forEach(e => {
          e.vx = -e.vx;
          e.y += 12;
          if (e.y + e.h > player.y) {
            shield = 0;
            endGame();
          }
        });
      }

      // Laser - Enemy Collisions
      for (let li = lasers.length - 1; li >= 0; li--) {
        const l = lasers[li];
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
          const e = enemies[ei];
          if (l.x < e.x + e.w && l.x + l.w > e.x && l.y < e.y + e.h && l.y + l.h > e.y) {
            lasers.splice(li, 1);
            e.hp--;
            createExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color);
            if (e.hp <= 0) {
              enemies.splice(ei, 1);
              score += 150 * wave;
              document.getElementById('scoreDisplay').innerText = String(score).padStart(5, '0');
            }
            break;
          }
        }
      }

      // Check Next Wave
      if (enemies.length === 0) {
        wave++;
        document.getElementById('waveDisplay').innerText = wave;
        shield = Math.min(100, shield + 20);
        document.getElementById('shieldDisplay').innerText = shield + '%';
        spawnWave();
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    function draw() {
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, 800, 480);

      // Stars
      ctx.fillStyle = '#ffffff';
      stars.forEach(s => {
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Player Spaceship
      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.moveTo(player.x + player.w / 2, player.y);
      ctx.lineTo(player.x + player.w, player.y + player.h);
      ctx.lineTo(player.x + player.w / 2, player.y + player.h - 6);
      ctx.lineTo(player.x, player.y + player.h);
      ctx.closePath();
      ctx.fill();

      // Engine Thruster
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(player.x + player.w / 2 - 3, player.y + player.h - 4, 6, 8 + Math.random() * 6);

      // Lasers
      ctx.fillStyle = '#38bdf8';
      lasers.forEach(l => {
        ctx.fillRect(l.x, l.y, l.w, l.h);
      });

      // Enemies
      enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.w, e.h);
        ctx.fillStyle = '#000';
        ctx.fillRect(e.x + 6, e.y + 6, 4, 6);
        ctx.fillRect(e.x + e.w - 10, e.y + 6, 4, 6);
      });

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      });

      // Start Screen
      if (!gameStarted) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, 800, 480);
        ctx.fillStyle = '#00d4ff';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('CYBERSTRIKE 16-BIT', 400, 200);
        ctx.fillStyle = '#facc15';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText('PRESS SPACE OR CLICK TO START MISSION', 400, 260);
      }

      // Game Over Screen
      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, 800, 480);
        ctx.fillStyle = '#ef4444';
        ctx.font = '28px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION FAILED', 400, 190);
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText('FINAL SCORE: ' + score, 400, 240);
        ctx.fillStyle = '#4ade80';
        ctx.font = '11px "Press Start 2P"';
        ctx.fillText('PRESS SPACE TO RESTART', 400, 290);
      }
    }

    function endGame() {
      gameOver = true;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('cyber_high', highScore);
        document.getElementById('highDisplay').innerText = highScore;
      }
    }

    function restartGame() {
      score = 0;
      wave = 1;
      shield = 100;
      gameOver = false;
      document.getElementById('scoreDisplay').innerText = '00000';
      document.getElementById('waveDisplay').innerText = '1';
      document.getElementById('shieldDisplay').innerText = '100%';
      lasers.length = 0;
      particles.length = 0;
      spawnWave();
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }
    draw();
  </script>
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
