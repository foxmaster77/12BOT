import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { sound } from '../lib/soundFx';

interface AgentState {
  id: string;
  name: string;
  role: string;
  model: string;
  color: string;
  state: 'idle' | 'walking' | 'working' | 'coffee' | 'done' | 'out_of_tokens';
  message: string;
  deskX: number;
  deskY: number;
  currentX: number;
  currentY: number;
  carrying: string | null;
  tokensUsed: number;
  logs: string[];
}

interface FlyingEnvelope {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const INITIAL_AGENTS: AgentState[] = [
  // Top Row (6 Desks)
  { id: 'pm', name: 'A01 PM', role: 'Lead Architect (Michael)', model: 'Groq / Qwen-3', color: '#38bdf8', state: 'idle', message: 'Standing by', deskX: 27.8, deskY: 29.5, currentX: 27.8, currentY: 29.5, carrying: null, tokensUsed: 0, logs: ['System initialized.'] },
  { id: 'idea', name: 'A02 Idea', role: 'Copywriter & Sitemap', model: 'Gemini 2.0 Flash', color: '#facc15', state: 'idle', message: 'Waiting for brief', deskX: 37.8, deskY: 29.5, currentX: 37.8, currentY: 29.5, carrying: null, tokensUsed: 0, logs: ['Copy engine ready.'] },
  { id: 'designer', name: 'A03 Design', role: 'UI/UX & Design Tokens', model: 'Gemini 2.0 Flash', color: '#f472b6', state: 'idle', message: 'Palettes ready', deskX: 44.8, deskY: 29.5, currentX: 44.8, currentY: 29.5, carrying: null, tokensUsed: 0, logs: ['Design system loaded.'] },
  { id: 'html_dev', name: 'A04 HTML', role: 'HTML5 Semantic Dev', model: 'Groq / Qwen-3', color: '#22d3ee', state: 'idle', message: 'Markup ready', deskX: 54.8, deskY: 29.5, currentX: 54.8, currentY: 29.5, carrying: null, tokensUsed: 0, logs: ['HTML parser ready.'] },
  { id: 'css_dev', name: 'A05 CSS', role: 'Responsive Stylesheets', model: 'Gemini 2.0 Flash', color: '#c084fc', state: 'idle', message: 'CSS ready', deskX: 62.4, deskY: 29.5, currentX: 62.4, currentY: 29.5, carrying: null, tokensUsed: 0, logs: ['CSS3 tokens active.'] },
  { id: 'js_dev', name: 'A06 JS', role: 'Interactive Scripts', model: 'Groq / Qwen-3', color: '#fb923c', state: 'idle', message: 'DOM ready', deskX: 72.8, deskY: 29.5, currentX: 72.8, currentY: 29.5, carrying: null, tokensUsed: 0, logs: ['JS runtime idle.'] },

  // Bottom Row (6 Desks)
  { id: 'anim_dev', name: 'A07 Anim', role: 'Motion & FX Engineer', model: 'Gemini 2.0 Flash', color: '#a3e635', state: 'idle', message: 'Keyframes ready', deskX: 24.2, deskY: 56.5, currentX: 24.2, currentY: 56.5, carrying: null, tokensUsed: 0, logs: ['Canvas engine active.'] },
  { id: 'backend_dev', name: 'A08 Back', role: 'Express API Server', model: 'Groq / Qwen-3', color: '#4ade80', state: 'idle', message: 'Endpoints ready', deskX: 35.2, deskY: 56.5, currentX: 35.2, currentY: 56.5, carrying: null, tokensUsed: 0, logs: ['Express router idle.'] },
  { id: 'db_dev', name: 'A09 DB', role: 'Database & SQL Dev', model: 'Gemini 2.0 Flash', color: '#fbbf24', state: 'idle', message: 'Schema ready', deskX: 44.2, deskY: 56.5, currentX: 44.2, currentY: 56.5, carrying: null, tokensUsed: 0, logs: ['SQL client active.'] },
  { id: 'debugger_1', name: 'A10 QA-1', role: 'Frontend QA Linter', model: 'Groq / Qwen-3', color: '#f87171', state: 'idle', message: 'Linter ready', deskX: 54.8, deskY: 56.5, currentX: 54.8, currentY: 56.5, carrying: null, tokensUsed: 0, logs: ['Test runner ready.'] },
  { id: 'debugger_2', name: 'A11 QA-2', role: 'System Reviewer', model: 'Gemini 2.0 Flash', color: '#2dd4bf', state: 'idle', message: 'QA ready', deskX: 62.4, deskY: 56.5, currentX: 62.4, currentY: 56.5, carrying: null, tokensUsed: 0, logs: ['Audit suite ready.'] },
  { id: 'docs_writer', name: 'A12 Docs', role: 'Technical Writer', model: 'Groq / Qwen-3', color: '#818cf8', state: 'idle', message: 'Docs ready', deskX: 72.8, deskY: 56.5, currentX: 72.8, currentY: 56.5, carrying: null, tokensUsed: 0, logs: ['README builder ready.'] },
];

const NICHE_PROMPTS: Record<string, string> = {
  Website: 'Build a high-end dark portfolio site for a wildlife photographer named LUMEN with neon cyan highlights.',
  App: 'Build a modern responsive habit tracking web app with streaks, dark mode, and interactive completion charts.',
  Dashboard: 'Build an analytics SaaS dashboard with real-time KPI metrics, dark glassmorphism, and revenue tables.',
  Game: 'Build a retro 16-bit browser arcade game with canvas scoreboards, sound effects, and particle FX.',
};

const NICHE_PROJECT: Record<string, string> = {
  Website: 'LUMEN Portfolio',
  App: 'Habit Tracker App',
  Dashboard: 'Analytics SaaS',
  Game: 'Retro Arcade Game',
};

// Workstations Coordinates
const STATIONS = {
  PLANNING_BOARD: { x: 12.0, y: 22.0, name: '📋 PLANNING BOARD' },
  DESIGN_EASEL:   { x: 38.0, y: 18.0, name: '🎨 DESIGN STUDIO' },
  COFFEE_BAR:     { x: 89.0, y: 18.0, name: '☕ COFFEE STATION' },
  DEPLOY_PORTAL:  { x: 88.0, y: 58.0, name: '🌐 DEPLOY PORTAL' },
};

export default function OrchestraInterface() {
  const [isDayMode, setIsDayMode] = useState(true);
  const [viewMode, setViewMode] = useState<'floor' | 'split' | 'logs'>('floor');
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('Website');
  const [prompt, setPrompt] = useState(NICHE_PROMPTS['Website']);
  const [tokensRemaining, setTokensRemaining] = useState(500);
  const [agents, setAgents] = useState<AgentState[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [envelopes, setEnvelopes] = useState<FlyingEnvelope[]>([]);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  // Sound Toggle
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
      prev.map((a) => (a.state === 'out_of_tokens' ? { ...a, state: 'idle', message: 'Restored & Ready' } : a))
    );
  };

  // Dispatch an envelope particle from Agent A to Agent B
  const dispatchEnvelope = (fromX: number, fromY: number, toX: number, toY: number) => {
    sound.playDispatch();
    const envId = Date.now() + Math.random();
    setEnvelopes((prev) => [...prev, { id: envId, fromX, fromY, toX, toY }]);
    setTimeout(() => {
      setEnvelopes((prev) => prev.filter((e) => e.id !== envId));
    }, 850);
  };

  // Trigger 2D Multi-Agent Office Execution
  const handleGenerate = async () => {
    if (isProcessing) return;

    if (tokensRemaining <= 0) {
      sound.playError();
      setAgents((prev) =>
        prev.map((a) => ({ ...a, state: 'out_of_tokens', message: '🪫 Out of tokens' }))
      );
      return;
    }

    sound.playClick();
    setIsProcessing(true);
    setDeployUrl(null);
    setTokensRemaining((t) => Math.max(0, t - 60));

    // Reset agent positions
    setAgents(INITIAL_AGENTS.map((a) => ({ ...a })));

    // 1. Trigger Real Backend Build Call
    const buildReq = fetch('http://localhost:4000/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: `[${selectedNiche}] ${prompt}` }),
    })
      .then((r) => r.json())
      .catch(() => null);

    // ── STAGE 1: PM walks to Planning Board ──
    setProcessingStage('PM Planning Architecture…');
    sound.playTyping();
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'pm'
          ? {
              ...a,
              state: 'walking',
              currentX: STATIONS.PLANNING_BOARD.x,
              currentY: STATIONS.PLANNING_BOARD.y,
              message: 'Walking to Board 📋',
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 650));

    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'pm'
          ? {
              ...a,
              state: 'working',
              message: 'Drafting Spec 💡',
              tokensUsed: a.tokensUsed + 35,
              logs: [...a.logs, `Architecture drafted for [${selectedNiche}]`],
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 550));

    // PM walks back with Spec Artifact
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'pm'
          ? {
              ...a,
              state: 'walking',
              currentX: a.deskX,
              currentY: a.deskY,
              carrying: '📄 Spec.md',
              message: 'Returning to Desk',
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 600));

    // PM sends envelopes to Designer & HTML dev
    dispatchEnvelope(27.8, 29.5, 44.8, 29.5); // to Designer
    dispatchEnvelope(27.8, 29.5, 54.8, 29.5); // to HTML

    // ── STAGE 2: Designer walks to Design Studio ──
    setProcessingStage('Designer Creating Palettes…');
    sound.playTyping();
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'designer'
          ? {
              ...a,
              state: 'walking',
              currentX: STATIONS.DESIGN_EASEL.x,
              currentY: STATIONS.DESIGN_EASEL.y,
              message: 'Heading to Easel 🎨',
            }
          : a.id === 'pm'
          ? { ...a, state: 'done', carrying: null, message: 'Spec Complete ✓' }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 650));

    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'designer'
          ? {
              ...a,
              state: 'working',
              message: 'Styling Palette 🎨',
              tokensUsed: a.tokensUsed + 40,
              logs: [...a.logs, 'Design system and dark tokens created.'],
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 550));

    // Designer returns to desk
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'designer'
          ? {
              ...a,
              state: 'walking',
              currentX: a.deskX,
              currentY: a.deskY,
              carrying: '🎨 Palette.css',
              message: 'Returning to Desk',
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 600));
    dispatchEnvelope(44.8, 29.5, 62.4, 29.5); // Designer sends to CSS dev

    // ── STAGE 3: Core Dev Team Writing HTML, CSS, JS in Parallel ──
    setProcessingStage('Core Devs Coding in Quad…');
    sound.playTyping();
    setAgents((prev) =>
      prev.map((a) => {
        if (['html_dev', 'css_dev', 'js_dev'].includes(a.id)) {
          return {
            ...a,
            state: 'working',
            message: `${a.id.toUpperCase().replace('_', ' ')} Coding 💻`,
            tokensUsed: a.tokensUsed + 50,
            logs: [...a.logs, `Generated core ${a.id} module components.`],
          };
        }
        if (a.id === 'designer') return { ...a, state: 'done', carrying: null };
        return a;
      })
    );
    await new Promise((r) => setTimeout(r, 900));

    // Core devs send to Backend & Animator
    dispatchEnvelope(54.8, 29.5, 35.2, 56.5);
    dispatchEnvelope(72.8, 29.5, 24.2, 56.5);

    // ── STAGE 4: Backend, Database & Animator Building Engine ──
    setProcessingStage('Backend & Motion Integration…');
    sound.playTyping();
    setAgents((prev) =>
      prev.map((a) => {
        if (['html_dev', 'css_dev', 'js_dev'].includes(a.id)) {
          return { ...a, state: 'done', message: 'Code Written ✓' };
        }
        if (['anim_dev', 'backend_dev', 'db_dev'].includes(a.id)) {
          return {
            ...a,
            state: 'working',
            message: `${a.role.split(' ')[0]} Active 🚀`,
            tokensUsed: a.tokensUsed + 45,
            logs: [...a.logs, `Compiled ${a.role} assets and endpoints.`],
          };
        }
        return a;
      })
    );
    await new Promise((r) => setTimeout(r, 900));

    // ── STAGE 5: QA Testing & Deploy Portal Verification ──
    setProcessingStage('QA & Deploy Portal Finalizing…');
    sound.playTyping();
    setAgents((prev) =>
      prev.map((a) => {
        if (['anim_dev', 'backend_dev', 'db_dev'].includes(a.id)) {
          return { ...a, state: 'done', message: 'Modules Ready ✓' };
        }
        if (a.id === 'debugger_2') {
          return {
            ...a,
            state: 'walking',
            currentX: STATIONS.DEPLOY_PORTAL.x,
            currentY: STATIONS.DEPLOY_PORTAL.y,
            message: 'Deploying at Satellite 🌐',
          };
        }
        if (['debugger_1', 'docs_writer'].includes(a.id)) {
          return {
            ...a,
            state: 'working',
            message: 'Audit & README 📚',
            tokensUsed: a.tokensUsed + 30,
            logs: [...a.logs, 'Full suite audit passed. Documentation ready.'],
          };
        }
        return a;
      })
    );
    await new Promise((r) => setTimeout(r, 700));

    // QA returns to desk
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'debugger_2'
          ? {
              ...a,
              state: 'walking',
              currentX: a.deskX,
              currentY: a.deskY,
              message: 'Returning to Desk',
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 600));

    // ── STAGE 6: Team Coffee Break! ──
    setProcessingStage('All Tasks Complete! Coffee Break ☕');
    sound.playCoffee();
    setAgents((prev) =>
      prev.map((a, idx) => {
        if (idx % 2 === 0) {
          return {
            ...a,
            state: 'coffee',
            currentX: STATIONS.COFFEE_BAR.x - (idx * 1.5),
            currentY: STATIONS.COFFEE_BAR.y + (idx % 3 * 2),
            message: 'Sipping Espresso ☕',
          };
        }
        return { ...a, state: 'done', currentX: a.deskX, currentY: a.deskY, message: 'Verified ✓' };
      })
    );
    await new Promise((r) => setTimeout(r, 1400));

    // Return everyone to desk & idle
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        state: 'idle',
        currentX: a.deskX,
        currentY: a.deskY,
        carrying: null,
        message: 'Ready for next mission',
      }))
    );

    // Complete build!
    await buildReq;
    sound.playSuccess();
    setIsProcessing(false);
    setProcessingStage('');
    setDeployUrl('http://localhost:4000/preview');
    setPreviewKey((k) => k + 1);
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
            <div className="logo-icon">(†!†)</div>
            <div className="header-title-group">
              <h1>Orchestra2D Generator Interface</h1>
              <span className="header-subtext">12-Agent Autonomous Dev Simulation</span>
            </div>
          </div>

          {/* View Mode Chips */}
          <div className="view-mode-selector">
            <button
              className={`view-chip ${viewMode === 'floor' ? 'active' : ''}`}
              onClick={() => { sound.playClick(); setViewMode('floor'); }}
            >
              🎮 FLOOR
            </button>
            <button
              className={`view-chip ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => { sound.playClick(); setViewMode('split'); }}
            >
              🌐 SPLIT PREVIEW
            </button>
            <button
              className={`view-chip ${viewMode === 'logs' ? 'active' : ''}`}
              onClick={() => { sound.playClick(); setViewMode('logs'); }}
            >
              💻 LOGS
            </button>
          </div>

          <div className="header-right-cluster">
            {/* Sound Toggle */}
            <button className="sound-toggle-btn" onClick={toggleSound} title="Toggle 8-bit Sound FX">
              {isMuted ? '🔇' : '🔊'} SFX
            </button>

            {/* Live Token Budget Pill */}
            <div className={`token-counter-pill ${tokensRemaining < 100 ? 'low' : ''}`}>
              <span className="tok-label">TOKENS:</span>
              <span className="tok-num">{tokensRemaining}</span>
              <button className="recharge-quick-btn" onClick={handleRechargeTokens} title="Recharge +500">
                ⚡ +500
              </button>
            </div>

            {/* Day / Night Mode Switcher */}
            <button className="theme-toggle" onClick={() => { sound.playClick(); setIsDayMode(!isDayMode); }}>
              {isDayMode ? '🌙 Night' : '☀️ Day'}
            </button>
          </div>
        </header>

        {/* ── 2. VIEWPORT / FLOOR CANVAS ───────────────────────── */}
        <main className="viewport-container">
          {/* Main 2D Pixel Office Room */}
          <div className={`pixel-room-canvas ${isDayMode ? 'day-bg' : 'night-bg'}`} style={{ width: viewMode === 'split' ? '50%' : '100%' }}>
            
            {/* Interactive Stations Markers */}
            <div className="station-marker" style={{ left: `${STATIONS.PLANNING_BOARD.x}%`, top: `${STATIONS.PLANNING_BOARD.y}%` }}>
              {STATIONS.PLANNING_BOARD.name}
            </div>
            <div className="station-marker" style={{ left: `${STATIONS.DESIGN_EASEL.x}%`, top: `${STATIONS.DESIGN_EASEL.y}%` }}>
              {STATIONS.DESIGN_EASEL.name}
            </div>
            <div className="station-marker" style={{ left: `${STATIONS.COFFEE_BAR.x}%`, top: `${STATIONS.COFFEE_BAR.y}%` }}>
              {STATIONS.COFFEE_BAR.name}
            </div>
            <div className="station-marker" style={{ left: `${STATIONS.DEPLOY_PORTAL.x}%`, top: `${STATIONS.DEPLOY_PORTAL.y}%` }}>
              {STATIONS.DEPLOY_PORTAL.name}
            </div>

            {/* Flying Envelope Particle */}
            {envelopes.map((env) => (
              <div
                key={env.id}
                className="flying-envelope"
                style={{
                  left: `${env.toX}%`,
                  top: `${env.toY}%`,
                }}
              >
                ✉️
              </div>
            ))}

            {/* 12 Interactive Agent Characters */}
            {agents.map((agent) => {
              const isWorking = agent.state === 'working';
              const isWalking = agent.state === 'walking';
              const isCoffee = agent.state === 'coffee';
              const isOutOfTokens = agent.state === 'out_of_tokens';

              return (
                <div
                  key={agent.id}
                  className={`agent-character-entity ${agent.state}`}
                  style={{
                    left: `${agent.currentX}%`,
                    top: `${agent.currentY}%`,
                  }}
                  onClick={() => {
                    sound.playClick();
                    setSelectedAgent(agent);
                  }}
                  title={`Click to inspect ${agent.name} (${agent.role})`}
                >
                  {/* CRT Monitor Glow */}
                  <div className="monitor-coding-glow" />

                  {/* Carried Artifact */}
                  {agent.carrying && (
                    <div className="carried-artifact-token">{agent.carrying}</div>
                  )}

                  {/* Speech Bubbles */}
                  {isWorking && <div className="agent-speech-bubble typing">{agent.message}</div>}
                  {isWalking && <div className="agent-speech-bubble typing">{agent.message}</div>}
                  {isCoffee && <div className="agent-speech-bubble coffee">{agent.message}</div>}
                  {isOutOfTokens && <div className="agent-speech-bubble out_of_tokens">{agent.message}</div>}
                  {agent.state === 'done' && <div className="agent-speech-bubble done">{agent.message}</div>}
                </div>
              );
            })}
          </div>

          {/* Split-View Live Preview Pane */}
          {viewMode === 'split' && (
            <div className="split-preview-pane">
              <div className="split-preview-header">
                <span>🌐 LIVE PREVIEW: http://localhost:4000/preview</span>
                <button
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '10px' }}
                  onClick={() => setPreviewKey((k) => k + 1)}
                  title="Reload Preview"
                >
                  🔄 RELOAD
                </button>
              </div>
              <iframe
                key={previewKey}
                src={deployUrl || 'http://localhost:4000/preview'}
                className="preview-iframe"
                title="Generated Site Preview"
              />
            </div>
          )}

          {/* Logs View Pane */}
          {viewMode === 'logs' && (
            <div className="split-preview-pane" style={{ width: '100%' }}>
              <div className="split-preview-header">
                <span>💻 LIVE CLUSTER ACTIVITY FEED & TELEMETRY</span>
              </div>
              <div style={{ flex: 1, background: '#02040a', padding: '16px', overflowY: 'auto', fontFamily: 'Courier New', color: '#4ade80', fontSize: '0.8rem', lineHeight: '1.6' }}>
                <div>[SYSTEM] 12BOT Cluster Online · 12 Agents Registered · Base Sepolia Escrow Enabled</div>
                <div>[ROSTER] Michael (PM), Idea (Copy), Design (UI), HTML, CSS, JS, Anim, Backend, DB, QA-1, QA-2, Docs</div>
                <div>[TOKENS] Remaining budget: {tokensRemaining} tokens</div>
                {agents.map((a) => (
                  <div key={a.id} style={{ marginTop: '8px' }}>
                    <span style={{ color: a.color, fontWeight: 'bold' }}>[{a.name}]</span> {a.role}: {a.message} (Used: {a.tokensUsed} tokens)
                    {a.logs.map((log, i) => (
                      <div key={i} style={{ color: '#94a3b8', marginLeft: '16px' }}>&gt; {log}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Deployment Success Banner */}
          {deployUrl && viewMode !== 'split' && (
            <div className="live-deploy-banner">
              <span>🚀 BUILD DEPLOYED:</span>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                {deployUrl} ↗
              </a>
              <div className="banner-btn-group">
                <button
                  className="banner-action-btn"
                  onClick={() => { sound.playClick(); setViewMode('split'); }}
                >
                  SPLIT PREVIEW
                </button>
                <button className="banner-close-btn" onClick={() => setDeployUrl(null)}>✕</button>
              </div>
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
                  <span className="k">State:</span>
                  <span className="v" style={{ color: selectedAgent.color }}>
                    {selectedAgent.state.toUpperCase()}
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
