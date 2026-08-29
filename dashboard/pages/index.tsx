import React, { useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { sound } from '../lib/soundFx';
import OfficeCanvas from '../components/OfficeCanvas';
import type { AgentStatus } from '../components/OfficeCanvas';
import { generateSiteHtml } from '../lib/templates';

interface AgentInfo {
  id: string;
  name: string;   // e.g. "A03-DESIGN"
  role: string;
  model: string;
  color: string;
  status: AgentStatus;
  message: string;
  tokensUsed: number;
  logs: string[];
  iconType: string;
  colIndex: number;
}

interface FlyingEnvelope {
  id: number;
  toX: number;
  toY: number;
}

interface HistoryEntry {
  name: string;
  date: string;
}

// ─── AGENT DEFINITIONS ──────────────────────────────────────
const INITIAL_AGENTS: AgentInfo[] = [
  { id: 'pm',           name: 'A01-PM',     role: 'Project Manager',    model: 'Groq / Qwen-3',    color: '#38bdf8', status: 'idle', message: 'Ready for brief',   tokensUsed: 0, logs: ['System initialized.'],     iconType: 'avatar', colIndex: 0 },
  { id: 'idea',         name: 'A02-IDEA',   role: 'Idea & Copywriter',  model: 'Gemini Flash',     color: '#facc15', status: 'idle', message: 'Waiting for concept', tokensUsed: 0, logs: ['Copy engine ready.'],      iconType: 'avatar', colIndex: 1 },
  { id: 'designer',     name: 'A03-DESIGN', role: 'UI/UX Designer',     model: 'Gemini Flash',     color: '#f472b6', status: 'idle', message: 'Palettes ready',      tokensUsed: 0, logs: ['Design system loaded.'],   iconType: 'avatar', colIndex: 2 },
  { id: 'html_dev',     name: 'A04-HTML',   role: 'HTML5 Dev',          model: 'Groq / Qwen-3',    color: '#22d3ee', status: 'idle', message: 'Markup ready',        tokensUsed: 0, logs: ['HTML parser ready.'],     iconType: 'html',   colIndex: 3 },
  { id: 'css_dev',      name: 'A05-CSS',    role: 'CSS3 Dev',           model: 'Gemini Flash',     color: '#c084fc', status: 'idle', message: 'CSS tokens ready',   tokensUsed: 0, logs: ['CSS3 tokens active.'],    iconType: 'css',    colIndex: 4 },
  { id: 'js_dev',       name: 'A06-JS',     role: 'JavaScript Dev',     model: 'Groq / Qwen-3',    color: '#fb923c', status: 'idle', message: 'DOM scripts ready',  tokensUsed: 0, logs: ['JS runtime idle.'],       iconType: 'js',     colIndex: 5 },
  { id: 'animation_dev',name: 'A07-ANIM',   role: 'Animation Dev',      model: 'Gemini Flash',     color: '#a3e635', status: 'idle', message: 'Keyframes ready',    tokensUsed: 0, logs: ['Canvas engine active.'],  iconType: 'avatar', colIndex: 6 },
  { id: 'backend_dev',  name: 'A08-BACKEND',role: 'Backend Dev',        model: 'Groq / Qwen-3',    color: '#4ade80', status: 'idle', message: 'Server API ready',   tokensUsed: 0, logs: ['Express router idle.'],   iconType: 'avatar', colIndex: 7 },
  { id: 'db_dev',       name: 'A09-DB',     role: 'Database Dev',       model: 'Gemini Flash',     color: '#fbbf24', status: 'idle', message: 'Schema ready',       tokensUsed: 0, logs: ['SQL client active.'],    iconType: 'db',     colIndex: 8 },
  { id: 'debugger_1',   name: 'A10-QA1',    role: 'Frontend QA',        model: 'Groq / Qwen-3',    color: '#f87171', status: 'idle', message: 'Linter ready',       tokensUsed: 0, logs: ['Test runner ready.'],    iconType: 'avatar', colIndex: 9 },
  { id: 'debugger_2',   name: 'A11-QA2',    role: 'System QA',          model: 'Gemini Flash',     color: '#2dd4bf', status: 'idle', message: 'QA test ready',      tokensUsed: 0, logs: ['Audit suite ready.'],    iconType: 'avatar', colIndex: 10 },
  { id: 'docs_writer',  name: 'A12-DOCS',   role: 'Documentation Dev',  model: 'Groq / Qwen-3',    color: '#818cf8', status: 'idle', message: 'README ready',       tokensUsed: 0, logs: ['README builder ready.'], iconType: 'docs',   colIndex: 11 },
];

const NICHE_PROMPTS: Record<string, string> = {
  Website:   'Build a high-end dark portfolio site for a wildlife photographer named LUMEN with neon cyan highlights.',
  App:       'Build a modern responsive habit tracking web app with streaks, dark mode, and interactive charts.',
  Dashboard: 'Build an analytics SaaS dashboard with real-time KPI metrics, dark glassmorphism, and revenue tables.',
  Game:      'Build a retro 16-bit browser arcade game with canvas scoreboards, sound effects, and particle FX.',
};

const NICHE_PROJECT: Record<string, string> = {
  Website: 'LUMEN Portfolio', App: 'Habit Tracker App', Dashboard: 'Analytics SaaS', Game: 'Retro Arcade Game',
};

const PROJECT_HISTORY: HistoryEntry[] = [
  { name: 'Space Invaders Clone', date: 'Oct 26' },
  { name: 'Personal Blog v1',     date: 'Oct 24' },
  { name: 'E-commerce UI',        date: 'Oct 20' },
  { name: 'RPG Character Sheet',  date: 'Oct 18' },
];

// ─── ICON RENDERER ──────────────────────────────────────────
function AgentIcon({ iconType, colIndex }: { iconType: string; colIndex: number }) {
  switch (iconType) {
    case 'html':
      return (
        <div className="tech-badge html-badge">
          <span className="badge-tag">HTML</span>
          <span className="badge-num">5</span>
        </div>
      );
    case 'css':
      return (
        <div className="tech-badge css-badge">
          <span className="badge-tag">CSS</span>
          <span className="badge-num">3</span>
        </div>
      );
    case 'js':
      return (
        <div className="tech-badge js-badge">
          <span>JS</span>
        </div>
      );
    case 'db':
      return (
        <div className="tech-badge db-badge">
          <div className="db-cylinder top" />
          <div className="db-cylinder mid" />
          <div className="db-cylinder bot" />
        </div>
      );
    case 'docs':
      return (
        <div className="tech-badge docs-badge">
          <div className="doc-icon-body">
            <span className="doc-header-text">DOCS</span>
            <div className="doc-line" />
            <div className="doc-line" />
            <div className="doc-line short" />
          </div>
        </div>
      );
    default:
      return (
        <div
          className="pixel-sprite-avatar"
          style={{
            backgroundPosition: `${(colIndex / 11) * 100}% 0%`,
          }}
        />
      );
  }
}

// ─── STATUS DISPLAY ─────────────────────────────────────────
function statusLabel(s: AgentStatus): string {
  switch (s) {
    case 'working':   return '● WORKING';
    case 'done':      return '● DONE';
    case 'on_break':  return '● BREAK';
    case 'cooldown':  return '● BREAK';
    case 'debugging': return '● DEBUG';
    case 'token_swap':
    case 'token':     return '● TOKEN';
    case 'blocked':   return '● BLOCKED';
    default:          return '● IDLE';
  }
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function OrchestraInterface() {
  const [isDayMode, setIsDayMode]           = useState(true);
  const [isMuted, setIsMuted]               = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [selectedNiche, setSelectedNiche]   = useState('Website');
  const [prompt, setPrompt]                 = useState(NICHE_PROMPTS['Website']);
  const [tokensRemaining, setTokensRemaining] = useState(640);
  const [agents, setAgents]                 = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent]   = useState<AgentInfo | null>(null);
  const [envelopes, setEnvelopes]           = useState<FlyingEnvelope[]>([]);
  const [deployUrl, setDeployUrl]           = useState<string | null>(null);
  const [activeAgent, setActiveAgent]       = useState<string>('');
  const [buildProgress, setBuildProgress]   = useState(0);
  const [consoleLogs, setConsoleLogs]       = useState<string[]>([
    '[18:35:52] Scrolling Console log...',
    '[18:38:57] Scrolling: Console...',
    '[18:38:58] Scrolling: cfhooling and pawinieniy...',
  ]);

  // ── PIXI bridge (animation engine — DO NOT TOUCH) ──────────
  const pixiDispatch = useRef<((id: string, status: AgentStatus) => void) | null>(null);
  const handleCanvasReady = useCallback((fn: (id: string, status: AgentStatus) => void) => {
    pixiDispatch.current = fn;
  }, []);

  const dispatchAgentStatus = (id: string, status: AgentStatus, extra: Partial<AgentInfo> = {}) => {
    if (pixiDispatch.current) pixiDispatch.current(id, status);
    setAgents((prev) => prev.map((a) => a.id === id ? { ...a, status, ...extra } : a));
  };

  // ── SOUND / UI HANDLERS (DO NOT TOUCH) ─────────────────────
  const toggleSound = () => {
    const active = sound.toggleMute();
    setIsMuted(!active);
    if (active) sound.playClick();
  };

  const handleSelectNiche = (niche: string) => {
    sound.playClick();
    setSelectedNiche(niche);
    setPrompt(NICHE_PROMPTS[niche] || '');
  };

  const handleRechargeTokens = () => {
    sound.playClick();
    setTokensRemaining((t) => t + 500);
    agents.forEach((a) => { if (a.status === 'blocked') dispatchAgentStatus(a.id, 'idle', { message: 'Restored & Ready' }); });
  };

  const dispatchEnvelope = (toX: number, toY: number) => {
    sound.playDispatch();
    const envId = Date.now() + Math.random();
    setEnvelopes((prev) => [...prev, { id: envId, toX, toY }]);
    setTimeout(() => { setEnvelopes((prev) => prev.filter((e) => e.id !== envId)); }, 850);
  };

  // ── GENERATE PIPELINE (DO NOT TOUCH) ───────────────────────
  const handleGenerate = async () => {
    if (isProcessing) return;

    if (tokensRemaining <= 0) {
      sound.playError();
      INITIAL_AGENTS.forEach((a) => dispatchAgentStatus(a.id, 'blocked', { message: '⛔ No tokens' }));
      return;
    }

    sound.playClick();
    setIsProcessing(true);
    setDeployUrl(null);
    setBuildProgress(0);
    setTokensRemaining((t) => Math.max(0, t - 60));
    INITIAL_AGENTS.forEach((a) => dispatchAgentStatus(a.id, 'idle', { message: 'Ready', tokensUsed: 0 }));

    const buildReq = fetch('http://localhost:4000/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: `[${selectedNiche}] ${prompt}` }),
    }).then((r) => r.json()).catch(() => null);

    const stages = [
      { id: 'pm',           stage: 'PM Planning Architecture…',  msg: 'Breaking down brief 💡' },
      { id: 'idea',         stage: 'Drafting Copywriting…',       msg: 'Writing sitemap ✍️'    },
      { id: 'designer',     stage: 'Creating UI System…',         msg: 'Styling Palette 🎨'    },
      { id: 'html_dev',     stage: 'Writing HTML Markup…',        msg: 'index.html ready 📄'   },
      { id: 'css_dev',      stage: 'Styling Responsive CSS…',     msg: 'styles.css 💅'         },
      { id: 'js_dev',       stage: 'Adding Interactive JS…',      msg: 'script.js ⚡'          },
      { id: 'animation_dev',stage: 'Adding Micro-Animations…',    msg: 'Scroll FX ✨'          },
      { id: 'backend_dev',  stage: 'Building API Endpoints…',     msg: 'server.js 🚀'          },
      { id: 'db_dev',       stage: 'Designing SQL Schema…',       msg: 'schema.sql 🗄️'        },
      { id: 'debugger_1',   stage: 'Frontend QA Pass…',           msg: 'Checking HTML/CSS 🔍'  },
      { id: 'debugger_2',   stage: 'System Audit Pass…',          msg: 'Full test suite ✓'     },
      { id: 'docs_writer',  stage: 'Generating Documentation…',   msg: 'README.md 📚'          },
    ];

    for (let i = 0; i < stages.length; i++) {
      const { id, stage, msg } = stages[i];
      setProcessingStage(stage);
      setActiveAgent(id);
      setBuildProgress(Math.round(((i + 1) / stages.length) * 100));
      sound.playTyping();
      dispatchAgentStatus(id, 'working', { message: msg, tokensUsed: 45 });
      const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
      setConsoleLogs((prev) => [...prev.slice(-8), `[${ts}] ${stage}`]);

      if (i < stages.length - 1) {
        const next = INITIAL_AGENTS.find((a) => a.id === stages[i + 1].id);
        if (next) dispatchEnvelope(next.tokensUsed, 0);
      }

      await new Promise((r) => setTimeout(r, 450));
      dispatchAgentStatus(id, 'done', { message: 'Done ✓' });
    }

    setProcessingStage('Coffee Break ☕');
    sound.playCoffee();
    INITIAL_AGENTS.forEach((a, i) => {
      if (i % 2 === 0) dispatchAgentStatus(a.id, 'on_break', { message: 'Sipping espresso ☕' });
    });
    await new Promise((r) => setTimeout(r, 2000));

    INITIAL_AGENTS.forEach((a) => dispatchAgentStatus(a.id, 'idle', { message: 'Ready for next mission' }));

    // Generate fresh Claude/Antigravity-tier HTML5 production application
    const generatedHtml = generateSiteHtml(selectedNiche, prompt);
    if (typeof window !== 'undefined') {
      localStorage.setItem('12bot_preview_html', generatedHtml);
      localStorage.setItem('12bot_preview_niche', selectedNiche);
      localStorage.setItem('12bot_preview_prompt', prompt);
    }

    await buildReq;
    sound.playSuccess();
    setIsProcessing(false);
    setProcessingStage('');
    setActiveAgent('');
    setBuildProgress(100);
    setDeployUrl('/preview?niche=' + encodeURIComponent(selectedNiche));
  };

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Orchestra2D — 12BOT AI Dev Team</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="orchestra-app">

        {/* ── HEADER ───────────────────────────────────────── */}
        <header className="app-header">
          <div className="header-left-cluster">
            {/* Spinning logo circle */}
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 3a9 9 0 0 1 0 18" strokeLinecap="round" strokeDasharray="4 4"/>
                <circle cx="12" cy="12" r="3" fill="#00d4ff"/>
              </svg>
            </div>
            <h1>Orchestra2D</h1>
          </div>

          <div className="header-right-cluster">
            {/* Token pill */}
            <div className={`token-counter-pill ${tokensRemaining < 100 ? 'low' : ''}`}>
              <span>🪙</span>
              <span className="tok-label">TOKENS:</span>
              <span className="tok-num">{tokensRemaining}</span>
              <button className="recharge-quick-btn" onClick={handleRechargeTokens} title="Recharge +500">+500</button>
            </div>

            {/* Night Mode toggle */}
            <button className="theme-toggle" onClick={() => { sound.playClick(); setIsDayMode(!isDayMode); }}>
              Night Mode
              <div className="toggle-track">
                <div className="toggle-knob" style={{ right: isDayMode ? '2px' : 'auto', left: isDayMode ? 'auto' : '2px' }} />
              </div>
            </button>
          </div>
        </header>

        {/* ── BODY ─────────────────────────────────────────── */}
        <div className="app-body">

          {/* ── LEFT SIDEBAR ─────────────────────────────── */}
          <aside className="left-sidebar">
            {/* Project History */}
            <div className="history-panel">
              <div className="history-panel-header">
                <h3>PROJECT HISTORY</h3>
                <button className="search-icon-btn" title="Search">🔍</button>
              </div>
              <div className="history-list">
                {PROJECT_HISTORY.map((item, i) => (
                  <div key={i} className="history-item">
                    <div className="history-item-date">{item.date}</div>
                    <div className="history-item-name">{item.name}</div>
                    <div className="history-item-check">✓</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Project */}
            <div className="current-project-panel">
              <h3>CURRENT PROJECT</h3>
              <div className="project-meta">
                <span className="label">Build:</span>
                <span className="val-cyan">{NICHE_PROJECT[selectedNiche]}</span>
              </div>
              <div className="project-meta">
                <span className="label">Niche:</span>
                <span className="val-green">{selectedNiche}</span>
              </div>
              {/* Progress bar */}
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${buildProgress}%` }} />
              </div>
              {activeAgent && (
                <div className="active-agent-label">
                  Active Agent: <span>{activeAgent.toUpperCase()}</span>
                </div>
              )}
              <div className="console-log">
                {consoleLogs.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT ─────────────────────────────── */}
          <div className="main-content">
            {/* Deploy HUD — shows when build is ready */}
            {deployUrl && (
              <div className="deploy-hud">
                <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="deploy-hud-btn">
                  🌐 LIVE PREVIEW
                </a>
                <div className="deploy-hud-sep" />
                <a href="http://localhost:4000/api/download" download="12bot-project.zip" className="deploy-hud-btn">
                  ⬇️ DOWNLOAD .ZIP
                </a>
                <div className="deploy-hud-sep" />
                <button className="deploy-hud-btn" onClick={() => setDeployUrl(null)}>
                  🚀 DEPLOY
                </button>
              </div>
            )}

            {/* ── AGENT CARD GRID ───────────────────────── */}
            <div className="agent-grid-area">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`agent-card ${agent.status}`}
                  onClick={() => { sound.playClick(); setSelectedAgent(agent); }}
                  title={`${agent.name} — ${agent.role}`}
                >
                  {/* Checkbox top-right */}
                  <div className={`card-checkbox ${agent.status === 'done' ? 'checked' : ''}`}>
                    {agent.status === 'done' ? '✓' : ''}
                  </div>

                  {/* Avatar / Tech Icon */}
                  <div className="card-avatar">
                    <AgentIcon iconType={agent.iconType} colIndex={agent.colIndex} />
                  </div>

                  {/* Label + status */}
                  <div className="card-label">
                    <div className="card-code">{agent.name}</div>
                    <div className="card-status">
                      <div className={`status-dot ${agent.status}`} />
                      <span className={`card-status-text ${agent.status === 'working' ? 'working' : ''}`}>
                        {agent.status === 'working' ? 'WORKING' : 'IDLE'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── BOTTOM ROW (Mission Prompt + Configuration & Generate) ── */}
            <div className="bottom-row">
              {/* Mission Prompt (Left Panel) */}
              <div className="bottom-panel mission-panel">
                <div className="mission-panel-header">
                  <div className="bottom-panel-title">MISSION PROMPT</div>
                  <button className="magic-wand-btn" onClick={() => setPrompt(NICHE_PROMPTS[selectedNiche])}>
                    🪄 Magic Wand
                  </button>
                </div>
                <div className="mission-text">
                  <textarea
                    className="mission-prompt-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your build prompt..."
                    spellCheck={false}
                  />
                </div>
                <div className="mission-panel-footer">
                  <span className="prompt-hint">📎 Prompt ready for multi-agent dispatch</span>
                  {isProcessing && <span className="processing-stage">{processingStage}</span>}
                </div>
              </div>

              {/* Configuration + Action (Right Panel) */}
              <div className="bottom-panel config-panel">
                <div className="bottom-panel-title">CONFIGURATION</div>

                <div className="config-row">
                  <span className="config-label">Niche</span>
                  <select
                    className="config-select"
                    value={selectedNiche}
                    onChange={(e) => handleSelectNiche(e.target.value)}
                  >
                    <option value="Website">Website</option>
                    <option value="App">App</option>
                    <option value="Dashboard">Dashboard</option>
                    <option value="Game">Game</option>
                  </select>
                </div>

                <div className="config-row">
                  <span className="config-label">Tech Stack</span>
                  <select className="config-select">
                    <option>React, Tailwind, etc...</option>
                    <option>Vanilla JS + CSS</option>
                    <option>Next.js + TypeScript</option>
                    <option>Vue + SCSS</option>
                  </select>
                </div>

                <div className="config-row">
                  <span className="config-label">Complexity</span>
                  <div className="complexity-wrap">
                    <input type="range" min={0} max={100} defaultValue={60} className="complexity-slider" />
                    <div className="complexity-labels">
                      <span>MVP</span>
                      <span>Production</span>
                    </div>
                  </div>
                </div>

                <div className="config-row token-limit-row">
                  <span className="config-label">Token Limit</span>
                  <span className="token-limit-val">300</span>
                </div>

                {/* Prominent High-Visibility Generate Button */}
                <button
                  className={`generate-btn ${isProcessing ? 'processing' : ''}`}
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  title="Dispatch brief to all 12 agents"
                >
                  {isProcessing ? (processingStage ? `⬛ ${processingStage}` : '⬛ GENERATING…') : '▶ GENERATE'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── PIXI CANVAS (hidden — drives all sprite animation) ── */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none', opacity: 0 }}>
          <OfficeCanvas
            onReady={handleCanvasReady}
            onAgentSelect={(id) => {
              const agent = agents.find((a) => a.id === id);
              if (agent) setSelectedAgent(agent);
            }}
          />
        </div>

        {/* ── AGENT INSPECT DRAWER ─────────────────────────── */}
        {selectedAgent && (
          <div className="agent-drawer-backdrop" onClick={() => setSelectedAgent(null)}>
            <div className="agent-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-top">
                <h3>
                  {selectedAgent.name}<br />
                  <span style={{ fontSize: '0.45rem', color: selectedAgent.color }}>{selectedAgent.role}</span>
                </h3>
                <button className="close-btn" onClick={() => setSelectedAgent(null)}>✕</button>
              </div>

              <div className="agent-stats-card">
                <div className="stat-item"><span className="k">LLM Model:</span><span className="v">{selectedAgent.model}</span></div>
                <div className="stat-item"><span className="k">Status:</span><span className="v" style={{ color: selectedAgent.color }}>{selectedAgent.status.toUpperCase()}</span></div>
                <div className="stat-item"><span className="k">Activity:</span><span className="v">{selectedAgent.message}</span></div>
                <div className="stat-item"><span className="k">Tokens Used:</span><span className="v">{selectedAgent.tokensUsed}</span></div>
              </div>

              {/* Direct Agent Command */}
              <div style={{ fontFamily: 'var(--font-main)', fontSize: '0.42rem', color: '#60a5fa', marginTop: 6 }}>DIRECT AGENT COMMAND</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder={`Command ${selectedAgent.name}...`}
                  style={{ flex: 1, background: '#02040a', border: '1px solid #1e293b', borderRadius: 4, padding: '6px 8px', color: '#fff', fontFamily: 'Courier New', fontSize: 11, outline: 'none' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const cmd = e.currentTarget.value.trim();
                      e.currentTarget.value = '';
                      sound.playTyping();
                      setAgents((prev) => prev.map((a) => a.id === selectedAgent.id ? { ...a, status: 'working', message: `Executing: "${cmd.slice(0, 20)}..."`, logs: [...a.logs, `[DIRECT COMMAND] ${cmd}`] } : a));
                      setTimeout(() => {
                        sound.playSuccess();
                        setAgents((prev) => prev.map((a) => a.id === selectedAgent.id ? { ...a, status: 'idle', message: 'Command executed ✓', logs: [...a.logs, `[SUCCESS] Output compiled for "${cmd}"`] } : a));
                      }, 1800);
                    }
                  }}
                />
              </div>

              <div style={{ fontFamily: 'var(--font-main)', fontSize: '0.42rem', color: '#64748b', marginTop: 6 }}>LIVE OUTPUT & LOGS</div>
              <div className="drawer-terminal">
                <div>[SYSTEM] Agent {selectedAgent.id} online.</div>
                <div>[ROLE] Specialization: {selectedAgent.role}</div>
                <div>[STATUS] Current task: {selectedAgent.message}</div>
                {selectedAgent.logs.map((log, i) => <div key={i}>{log}</div>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
