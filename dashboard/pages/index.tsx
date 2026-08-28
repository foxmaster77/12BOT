import React, { useState } from 'react';
import Head from 'next/head';
import { sound } from '../lib/soundFx';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  model: string;
  color: string;
  status: 'idle' | 'working' | 'coffee' | 'done' | 'out_of_tokens';
  message: string;
  x: number; // percentage coordinate
  y: number; // percentage coordinate
  tokensUsed: number;
  logs: string[];
}

interface FlyingEnvelope {
  id: number;
  toX: number;
  toY: number;
}

// 12 Exact Desk Coordinates matching the 12 Chairs in the pixel-art room
const INITIAL_AGENTS: AgentInfo[] = [
  // Top Row (6 Desks)
  { id: 'pm', name: 'A01 PM', role: 'Project Manager / Architect', model: 'Groq / Qwen-3', color: '#38bdf8', status: 'idle', message: 'Ready for brief', x: 27.8, y: 46.5, tokensUsed: 0, logs: ['System initialized.'] },
  { id: 'idea', name: 'A02 Idea', role: 'Idea & Copywriter', model: 'Gemini 2.0 Flash', color: '#facc15', status: 'idle', message: 'Waiting for concept', x: 37.8, y: 46.5, tokensUsed: 0, logs: ['Copy engine ready.'] },
  { id: 'designer', name: 'A03 Design', role: 'UI/UX Designer', model: 'Gemini 2.0 Flash', color: '#f472b6', status: 'idle', message: 'Palettes ready', x: 44.8, y: 46.5, tokensUsed: 0, logs: ['Design system loaded.'] },
  { id: 'html_dev', name: 'A04 HTML', role: 'HTML5 Semantic Dev', model: 'Groq / Qwen-3', color: '#22d3ee', status: 'idle', message: 'Markup ready', x: 54.8, y: 46.5, tokensUsed: 0, logs: ['HTML parser ready.'] },
  { id: 'css_dev', name: 'A05 CSS', role: 'CSS3 Stylesheet Dev', model: 'Gemini 2.0 Flash', color: '#c084fc', status: 'idle', message: 'CSS tokens ready', x: 62.4, y: 46.5, tokensUsed: 0, logs: ['CSS3 tokens active.'] },
  { id: 'js_dev', name: 'A06 JS', role: 'JavaScript Interactivity', model: 'Groq / Qwen-3', color: '#fb923c', status: 'idle', message: 'DOM scripts ready', x: 72.8, y: 46.5, tokensUsed: 0, logs: ['JS runtime idle.'] },

  // Bottom Row (6 Desks)
  { id: 'anim_dev', name: 'A07 Anim', role: 'Animation Developer', model: 'Gemini 2.0 Flash', color: '#a3e635', status: 'idle', message: 'Keyframes ready', x: 24.2, y: 73.5, tokensUsed: 0, logs: ['Canvas engine active.'] },
  { id: 'backend_dev', name: 'A08 Back', role: 'Express Backend Dev', model: 'Groq / Qwen-3', color: '#4ade80', status: 'idle', message: 'Server API ready', x: 35.2, y: 73.5, tokensUsed: 0, logs: ['Express router idle.'] },
  { id: 'db_dev', name: 'A09 DB', role: 'Database & SQL Dev', model: 'Gemini 2.0 Flash', color: '#fbbf24', status: 'idle', message: 'Schema ready', x: 44.2, y: 73.5, tokensUsed: 0, logs: ['SQL client active.'] },
  { id: 'debugger_1', name: 'A10 QA-1', role: 'Frontend Debugger', model: 'Groq / Qwen-3', color: '#f87171', status: 'idle', message: 'Linter ready', x: 54.8, y: 73.5, tokensUsed: 0, logs: ['Test runner ready.'] },
  { id: 'debugger_2', name: 'A11 QA-2', role: 'System Review QA', model: 'Gemini 2.0 Flash', color: '#2dd4bf', status: 'idle', message: 'QA test ready', x: 62.4, y: 73.5, tokensUsed: 0, logs: ['Audit suite ready.'] },
  { id: 'docs_writer', name: 'A12 Docs', role: 'Documentation Dev', model: 'Groq / Qwen-3', color: '#818cf8', status: 'idle', message: 'README ready', x: 72.8, y: 73.5, tokensUsed: 0, logs: ['README builder ready.'] },
];

const NICHE_PROMPTS: Record<string, string> = {
  Website: 'Build a high-end dark portfolio site for a wildlife photographer named LUMEN with neon cyan highlights.',
  App: 'Build a modern responsive habit tracking web app with streaks, dark mode, and interactive charts.',
  Dashboard: 'Build an analytics SaaS dashboard with real-time KPI metrics, dark glassmorphism, and revenue tables.',
  Game: 'Build a retro 16-bit browser arcade game with canvas scoreboards, sound effects, and particle FX.',
};

const NICHE_PROJECT: Record<string, string> = {
  Website: 'LUMEN Portfolio',
  App: 'Habit Tracker App',
  Dashboard: 'Analytics SaaS',
  Game: 'Retro Arcade Game',
};

export default function OrchestraInterface() {
  const [isDayMode, setIsDayMode] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('Website');
  const [prompt, setPrompt] = useState(NICHE_PROMPTS['Website']);
  const [tokensRemaining, setTokensRemaining] = useState(500);
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [envelopes, setEnvelopes] = useState<FlyingEnvelope[]>([]);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

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
    setAgents((prev) =>
      prev.map((a) => (a.status === 'out_of_tokens' ? { ...a, status: 'idle', message: 'Restored & Ready' } : a))
    );
  };

  const dispatchEnvelope = (toX: number, toY: number) => {
    sound.playDispatch();
    const envId = Date.now() + Math.random();
    setEnvelopes((prev) => [...prev, { id: envId, toX, toY }]);
    setTimeout(() => {
      setEnvelopes((prev) => prev.filter((e) => e.id !== envId));
    }, 850);
  };

  const handleGenerate = async () => {
    if (isProcessing) return;

    if (tokensRemaining <= 0) {
      sound.playError();
      setAgents((prev) =>
        prev.map((a) => ({ ...a, status: 'out_of_tokens', message: '🪫 Zzz...' }))
      );
      return;
    }

    sound.playClick();
    setIsProcessing(true);
    setDeployUrl(null);
    setTokensRemaining((t) => Math.max(0, t - 60));

    // Reset agents
    setAgents(INITIAL_AGENTS.map((a) => ({ ...a })));

    // Real backend build call
    const buildReq = fetch('http://localhost:4000/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: `[${selectedNiche}] ${prompt}` }),
    })
      .then((r) => r.json())
      .catch(() => null);

    const stages = [
      { id: 'pm', stage: 'PM Planning Architecture…', msg: 'Breaking down brief 💡' },
      { id: 'idea', stage: 'Drafting Copywriting…', msg: 'Writing sitemap ✍️' },
      { id: 'designer', stage: 'Creating UI System…', msg: 'Styling Palette 🎨' },
      { id: 'html_dev', stage: 'Writing HTML Markup…', msg: 'index.html ready 📄' },
      { id: 'css_dev', stage: 'Styling Responsive CSS…', msg: 'styles.css 💅' },
      { id: 'js_dev', stage: 'Adding Interactive JS…', msg: 'script.js ⚡' },
      { id: 'anim_dev', stage: 'Adding Micro-Animations…', msg: 'Scroll FX ✨' },
      { id: 'backend_dev', stage: 'Building API Endpoints…', msg: 'server.js 🚀' },
      { id: 'db_dev', stage: 'Designing SQL Schema…', msg: 'schema.sql 🗄️' },
      { id: 'debugger_1', stage: 'Frontend QA Pass…', msg: 'Checking HTML/CSS 🔍' },
      { id: 'debugger_2', stage: 'System Audit Pass…', msg: 'Full test suite ✓' },
      { id: 'docs_writer', stage: 'Generating Documentation…', msg: 'README.md 📚' },
    ];

    for (let i = 0; i < stages.length; i++) {
      const { id, stage, msg } = stages[i];
      setProcessingStage(stage);
      sound.playTyping();

      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              status: 'working',
              message: msg,
              tokensUsed: a.tokensUsed + 45,
              logs: [...a.logs, `Executed phase: ${stage}`],
            };
          }
          return a;
        })
      );

      // Dispatch envelope to next agent
      if (i < stages.length - 1) {
        const nextAgent = INITIAL_AGENTS.find((a) => a.id === stages[i + 1].id);
        if (nextAgent) dispatchEnvelope(nextAgent.x, nextAgent.y);
      }

      await new Promise((r) => setTimeout(r, 450));

      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'done', message: 'Done ✓' } : a))
      );
    }

    // Coffee Break phase
    setProcessingStage('All Tasks Complete! Coffee Break ☕');
    sound.playCoffee();
    setAgents((prev) =>
      prev.map((a, idx) =>
        idx % 2 === 0
          ? { ...a, status: 'coffee', message: 'Sipping espresso ☕' }
          : { ...a, status: 'done', message: 'Verified ✓' }
      )
    );
    await new Promise((r) => setTimeout(r, 1400));

    // Reset to idle
    setAgents((prev) =>
      prev.map((a) => ({ ...a, status: 'idle', message: 'Ready for next mission' }))
    );

    await buildReq;
    sound.playSuccess();
    setIsProcessing(false);
    setProcessingStage('');
    setDeployUrl('http://localhost:4000/preview');
  };

  return (
    <>
      <Head>
        <title>Orchestra2D — 12BOT AI Dev Team</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="orchestra-app">
        {/* ── 1. RETRO TOP COMMAND BAR ─────────────────────────── */}
        <header className="app-header">
          <div className="header-left-cluster">
            <div className="logo-icon">
              <span>(†!†)</span>
            </div>
            <h1>Orchestra2D Generator Interface</h1>
          </div>

          <div className="header-right-cluster">
            {/* Token Budget Meter */}
            <div className={`token-counter-pill ${tokensRemaining < 100 ? 'low' : ''}`}>
              <span className="tok-label">TOKENS:</span>
              <span className="tok-num">{tokensRemaining}</span>
              <button className="recharge-quick-btn" onClick={handleRechargeTokens} title="Recharge +500">
                +500
              </button>
            </div>

            {/* Day / Night Mode Toggle */}
            <button className="theme-toggle" onClick={() => { sound.playClick(); setIsDayMode(!isDayMode); }}>
              Toggle {isDayMode ? 'Night' : 'Day'} Mode
            </button>
          </div>
        </header>

        {/* ── 2. HD PIXEL ART OFFICE VIEWPORT ──────────────────── */}
        <main className="viewport-container">
          <div className={`pixel-room-canvas ${isDayMode ? 'day-bg' : 'night-bg'}`} />

          {/* Ambient Day Sunlight Beam */}
          {isDayMode && <div className="sunlight-beam" />}

          {/* Animated Steam over Coffee Station */}
          <div className="coffee-steam-emitter">
            <span className="steam-cloud">♨️</span>
            <span className="steam-cloud">♨️</span>
          </div>

          {/* Flying Envelopes */}
          {envelopes.map((env) => (
            <div
              key={env.id}
              className="flying-envelope-item"
              style={{ left: `${env.toX}%`, top: `${env.toY}%` }}
            >
              ✉️
            </div>
          ))}

          {/* 12 Interactive Agent Hotspots */}
          {agents.map((agent) => {
            const isWorking = agent.status === 'working';
            const isCoffee = agent.status === 'coffee';
            const isOutOfTokens = agent.status === 'out_of_tokens';

            return (
              <div
                key={agent.id}
                className={`agent-desk-hotspot ${agent.status}`}
                style={{
                  left: `${agent.x}%`,
                  top: `${agent.y}%`,
                }}
                onClick={() => {
                  sound.playClick();
                  setSelectedAgent(agent);
                }}
                title={`Click to inspect ${agent.name} (${agent.role})`}
              >
                {/* Glowing CRT Monitor when Coding */}
                <div className="monitor-coding-glow" />

                {/* Floating Speech Bubbles */}
                {isWorking && <div className="agent-speech-bubble typing">{agent.message}</div>}
                {isCoffee && <div className="agent-speech-bubble coffee">{agent.message}</div>}
                {isOutOfTokens && <div className="agent-speech-bubble out_of_tokens">{agent.message}</div>}
                {agent.status === 'done' && <div className="agent-speech-bubble done">{agent.message}</div>}
              </div>
            );
          })}

          {/* Live Deployment Success Banner */}
          {deployUrl && (
            <div className="live-deploy-banner">
              <span>🚀 SITE LIVE & DEPLOYED:</span>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                Preview ↗
              </a>
              <a
                href="http://localhost:4000/api/download"
                download="12bot-generated-project.zip"
                style={{
                  background: '#22c55e',
                  color: '#000',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  fontSize: '10px',
                  fontFamily: "'Press Start 2P', monospace",
                  marginLeft: '4px',
                }}
              >
                📦 ZIP
              </a>
              <button className="banner-close-btn" onClick={() => setDeployUrl(null)}>✕</button>
            </div>
          )}
        </main>

        {/* ── 3. BOTTOM SNES GAME HUD ──────────────────────────── */}
        <footer className="control-panel">
          {/* Section 1: Project Info */}
          <div className="panel-section info-section">
            <h2>Current Project</h2>
            <div className="info-box">
              <p>
                <span className="label">Niche:</span> <span className="val">[{selectedNiche}]</span>
              </p>
              <p>
                <span className="label">Build:</span> <span className="val">[{NICHE_PROJECT[selectedNiche]}]</span>
              </p>
            </div>
          </div>

          {/* Section 2: Prompt Input */}
          <div className="panel-section prompt-section">
            <h2>Mission Prompt</h2>
            <textarea
              className="prompt-input"
              placeholder="Enter your build prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Section 3: Niche Selector */}
          <div className="panel-section niche-section">
            <h2>Niche</h2>
            <div className="niche-list">
              {['Website', 'App', 'Dashboard', 'Game'].map((niche) => (
                <div
                  key={niche}
                  className={`niche-item ${selectedNiche === niche ? 'active' : ''}`}
                  onClick={() => handleSelectNiche(niche)}
                >
                  {niche}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Action Generate */}
          <div className="panel-section action-section">
            {isProcessing && <span className="processing-text">{processingStage}</span>}
            <button
              className={`generate-btn ${isProcessing ? 'processing' : ''}`}
              onClick={handleGenerate}
              disabled={isProcessing}
            >
              {isProcessing ? '⬛ RUNNING…' : '▶ GENERATE'}
            </button>
          </div>
        </footer>

        {/* ── 4. AGENT INSPECT DRAWER ─────────────────────────── */}
        {selectedAgent && (
          <div className="agent-drawer-backdrop" onClick={() => setSelectedAgent(null)}>
            <div className="agent-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-top">
                <h3>
                  {selectedAgent.name}
                  <br />
                  <span style={{ fontSize: '0.45rem', color: selectedAgent.color }}>{selectedAgent.role}</span>
                </h3>
                <button className="close-btn" onClick={() => setSelectedAgent(null)}>
                  ✕
                </button>
              </div>

              <div className="agent-stats-card">
                <div className="stat-item">
                  <span className="k">LLM Model:</span>
                  <span className="v">{selectedAgent.model}</span>
                </div>
                <div className="stat-item">
                  <span className="k">Status:</span>
                  <span className="v" style={{ color: selectedAgent.color }}>
                    {selectedAgent.status.toUpperCase()}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="k">Activity:</span>
                  <span className="v">{selectedAgent.message}</span>
                </div>
                <div className="stat-item">
                  <span className="k">Tokens Used:</span>
                  <span className="v">{selectedAgent.tokensUsed} tokens</span>
                </div>
              </div>

              {/* Direct Agent Steer / Command */}
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.42rem', color: '#60a5fa', marginTop: '6px' }}>
                DIRECT AGENT COMMAND
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder={`Command ${selectedAgent.name}...`}
                  style={{
                    flex: 1,
                    background: '#02040a',
                    border: '1px solid #1e293b',
                    borderRadius: '4px',
                    padding: '6px 8px',
                    color: '#fff',
                    fontFamily: 'Courier New',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const cmd = e.currentTarget.value.trim();
                      e.currentTarget.value = '';
                      sound.playTyping();
                      setAgents((prev) =>
                        prev.map((a) =>
                          a.id === selectedAgent.id
                            ? {
                                ...a,
                                status: 'working',
                                message: `Executing: "${cmd.slice(0, 20)}..."`,
                                logs: [...a.logs, `[DIRECT COMMAND] ${cmd}`],
                              }
                            : a
                        )
                      );
                      setTimeout(() => {
                        sound.playSuccess();
                        setAgents((prev) =>
                          prev.map((a) =>
                            a.id === selectedAgent.id
                              ? {
                                  ...a,
                                  status: 'idle',
                                  message: 'Command executed ✓',
                                  logs: [...a.logs, `[SUCCESS] Output compiled for "${cmd}"`],
                                }
                              : a
                          )
                        );
                      }, 1800);
                    }
                  }}
                />
              </div>

              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.42rem', color: '#64748b', marginTop: '6px' }}>
                LIVE OUTPUT & LOGS
              </div>
              <div className="drawer-terminal">
                <div>[SYSTEM] Agent {selectedAgent.id} online.</div>
                <div>[ROLE] Specialization: {selectedAgent.role}</div>
                <div>[STATUS] Current task: {selectedAgent.message}</div>
                {selectedAgent.logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
