import React, { useState } from 'react';
import Head from 'next/head';
import { sound } from '../lib/soundFx';

export type AgentStateType = 'IDLE' | 'TYPING' | 'DRINKING_COFFEE' | 'OUT_OF_TOKENS' | 'WALKING';

interface PixelAgent {
  id: string;
  name: string;
  role: string;
  hairColor: string;
  shirtColor: string;
  state: AgentStateType;
  message: string;
  deskX: number; // percentage (0 - 100)
  deskY: number; // percentage (0 - 100)
  currentX: number;
  currentY: number;
  tokensUsed: number;
  logs: string[];
}

interface FlyingEnvelope {
  id: number;
  toX: number;
  toY: number;
}

// 12 Distinct Agent Identities arranged across the 2D Office Quad
const INITIAL_AGENTS: PixelAgent[] = [
  // Executive Office / PM
  { id: 'pm', name: 'A01 PM', role: 'Michael (Architect)', hairColor: '#1e293b', shirtColor: '#38bdf8', state: 'IDLE', message: 'Standing by', deskX: 12, deskY: 28, currentX: 12, currentY: 28, tokensUsed: 0, logs: ['Lead supervisor online.'] },
  { id: 'idea', name: 'A02 Idea', role: 'Copywriter & Sitemap', hairColor: '#b45309', shirtColor: '#facc15', state: 'IDLE', message: 'Waiting for concept', deskX: 28, deskY: 28, currentX: 28, currentY: 28, tokensUsed: 0, logs: ['Copywriting engine ready.'] },
  { id: 'designer', name: 'A03 Design', role: 'UI/UX & Tokens', hairColor: '#be185d', shirtColor: '#f472b6', state: 'IDLE', message: 'Palettes ready', deskX: 44, deskY: 28, currentX: 44, currentY: 28, tokensUsed: 0, logs: ['Design system loaded.'] },
  { id: 'html_dev', name: 'A04 HTML', role: 'HTML5 Semantic Dev', hairColor: '#0369a1', shirtColor: '#22d3ee', state: 'IDLE', message: 'Markup ready', deskX: 60, deskY: 28, currentX: 60, currentY: 28, tokensUsed: 0, logs: ['HTML parser ready.'] },

  // Mid Developer Row
  { id: 'css_dev', name: 'A05 CSS', role: 'CSS3 Stylesheets', hairColor: '#6b21a8', shirtColor: '#c084fc', state: 'IDLE', message: 'Styles ready', deskX: 12, deskY: 58, currentX: 12, currentY: 58, tokensUsed: 0, logs: ['CSS3 tokens active.'] },
  { id: 'js_dev', name: 'A06 JS', role: 'JavaScript Logic', hairColor: '#c2410c', shirtColor: '#fb923c', state: 'IDLE', message: 'DOM scripts ready', deskX: 28, deskY: 58, currentX: 28, currentY: 58, tokensUsed: 0, logs: ['JS runtime initialized.'] },
  { id: 'anim_dev', name: 'A07 Anim', role: 'Motion & FX Engineer', hairColor: '#4d7c0f', shirtColor: '#a3e635', state: 'IDLE', message: 'Keyframes ready', deskX: 44, deskY: 58, currentX: 44, currentY: 58, tokensUsed: 0, logs: ['Canvas engine active.'] },
  { id: 'backend_dev', name: 'A08 Back', role: 'Express Backend Dev', hairColor: '#047857', shirtColor: '#4ade80', state: 'IDLE', message: 'API ready', deskX: 60, deskY: 58, currentX: 60, currentY: 58, tokensUsed: 0, logs: ['Express router idle.'] },

  // Bottom Row / QA & DB
  { id: 'db_dev', name: 'A09 DB', role: 'Database & SQL Dev', hairColor: '#d97706', shirtColor: '#fbbf24', state: 'IDLE', message: 'Schema ready', deskX: 12, deskY: 84, currentX: 12, currentY: 84, tokensUsed: 0, logs: ['SQL client active.'] },
  { id: 'debugger_1', name: 'A10 QA-1', role: 'Frontend Linter', hairColor: '#b91c1c', shirtColor: '#f87171', state: 'IDLE', message: 'Linter ready', deskX: 28, deskY: 84, currentX: 28, currentY: 84, tokensUsed: 0, logs: ['Test runner ready.'] },
  { id: 'debugger_2', name: 'A11 QA-2', role: 'System Auditor', hairColor: '#0f766e', shirtColor: '#2dd4bf', state: 'IDLE', message: 'QA test ready', deskX: 44, deskY: 84, currentX: 44, currentY: 84, tokensUsed: 0, logs: ['Audit suite ready.'] },
  { id: 'docs_writer', name: 'A12 Docs', role: 'Documentation Dev', hairColor: '#3730a3', shirtColor: '#818cf8', state: 'IDLE', message: 'README ready', deskX: 60, deskY: 84, currentX: 60, currentY: 84, tokensUsed: 0, logs: ['README builder ready.'] },
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

// Key station coordinates on the floor
const COFFEE_STATION = { x: 89, y: 22 };
const SERVER_STATION = { x: 89, y: 76 };

export default function OrchestraInterface() {
  const [viewMode, setViewMode] = useState<'floor' | 'split' | 'logs'>('floor');
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('Website');
  const [prompt, setPrompt] = useState(NICHE_PROMPTS['Website']);
  const [tokensRemaining, setTokensRemaining] = useState(500);
  const [agents, setAgents] = useState<PixelAgent[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<PixelAgent | null>(null);
  const [envelopes, setEnvelopes] = useState<FlyingEnvelope[]>([]);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

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
      prev.map((a) => (a.state === 'OUT_OF_TOKENS' ? { ...a, state: 'IDLE', message: 'Restored & Ready' } : a))
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

  // Main 12BOT Execution Pipeline
  const handleGenerate = async () => {
    if (isProcessing) return;

    if (tokensRemaining <= 0) {
      sound.playError();
      setAgents((prev) =>
        prev.map((a) => ({ ...a, state: 'OUT_OF_TOKENS', message: '🪫 Zzz...' }))
      );
      return;
    }

    sound.playClick();
    setIsProcessing(true);
    setDeployUrl(null);
    setTokensRemaining((t) => Math.max(0, t - 60));

    // Reset everyone to desk
    setAgents(INITIAL_AGENTS.map((a) => ({ ...a })));

    // Trigger backend build
    const buildReq = fetch('http://localhost:4000/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: `[${selectedNiche}] ${prompt}` }),
    })
      .then((r) => r.json())
      .catch(() => null);

    // ── STAGE 1: PM & Idea Drafting ──
    setProcessingStage('PM & Copywriter Drafting Architecture…');
    sound.playTyping();
    setAgents((prev) =>
      prev.map((a) =>
        ['pm', 'idea'].includes(a.id)
          ? {
              ...a,
              state: 'TYPING',
              message: 'Writing Spec 💡',
              tokensUsed: a.tokensUsed + 35,
              logs: [...a.logs, `Architecture drafted for [${selectedNiche}]`],
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 1000));

    // Dispatch envelopes from PM/Idea to Designer & Devs
    dispatchEnvelope(44, 28);
    dispatchEnvelope(60, 28);

    // ── STAGE 2: Designer & HTML/CSS/JS Coding ──
    setProcessingStage('Designer & Frontend Quad Coding…');
    sound.playTyping();
    setAgents((prev) =>
      prev.map((a) => {
        if (['designer', 'html_dev', 'css_dev', 'js_dev'].includes(a.id)) {
          return {
            ...a,
            state: 'TYPING',
            message: 'Writing code 💻',
            tokensUsed: a.tokensUsed + 45,
            logs: [...a.logs, `Compiled ${a.role} templates & logic.`],
          };
        }
        if (['pm', 'idea'].includes(a.id)) return { ...a, state: 'IDLE', message: 'Spec Complete ✓' };
        return a;
      })
    );
    await new Promise((r) => setTimeout(r, 1200));

    // Dispatch envelopes to Backend, DB & Animator
    dispatchEnvelope(60, 58);
    dispatchEnvelope(12, 84);

    // ── STAGE 3: Backend, DB & Animation ──
    setProcessingStage('Backend, Database & Animation Engines…');
    sound.playTyping();
    setAgents((prev) =>
      prev.map((a) => {
        if (['anim_dev', 'backend_dev', 'db_dev'].includes(a.id)) {
          return {
            ...a,
            state: 'TYPING',
            message: 'Building endpoints 🚀',
            tokensUsed: a.tokensUsed + 40,
            logs: [...a.logs, `Compiled ${a.role} schema & API routes.`],
          };
        }
        if (['designer', 'html_dev', 'css_dev', 'js_dev'].includes(a.id)) {
          return { ...a, state: 'IDLE', message: 'Code Written ✓' };
        }
        return a;
      })
    );
    await new Promise((r) => setTimeout(r, 1200));

    // ── STAGE 4: QA walks to Server Rack for Deployment ──
    setProcessingStage('QA Walking to Server Rack…');
    sound.playTyping();
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === 'debugger_2') {
          return {
            ...a,
            state: 'WALKING',
            currentX: SERVER_STATION.x,
            currentY: SERVER_STATION.y,
            message: 'Auditing at Server 🌐',
          };
        }
        if (['debugger_1', 'docs_writer'].includes(a.id)) {
          return {
            ...a,
            state: 'TYPING',
            message: 'Audit & README 📚',
            tokensUsed: a.tokensUsed + 30,
            logs: [...a.logs, 'Full suite audit passed. README published.'],
          };
        }
        return a;
      })
    );
    await new Promise((r) => setTimeout(r, 1200));

    // QA returns to desk
    setAgents((prev) =>
      prev.map((a) =>
        a.id === 'debugger_2'
          ? {
              ...a,
              state: 'WALKING',
              currentX: a.deskX,
              currentY: a.deskY,
              message: 'Returning to Desk',
            }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 1200));

    // ── STAGE 5: Team Walking to Coffee Station! ──
    setProcessingStage('All Tasks Complete! Coffee Break ☕');
    sound.playCoffee();
    setAgents((prev) =>
      prev.map((a, idx) => {
        if (idx % 2 === 0) {
          return {
            ...a,
            state: 'WALKING',
            currentX: COFFEE_STATION.x - (idx * 2),
            currentY: COFFEE_STATION.y + (idx % 3 * 3),
            message: 'Heading to Coffee ☕',
          };
        }
        return { ...a, state: 'IDLE', message: 'Verified ✓' };
      })
    );
    await new Promise((r) => setTimeout(r, 1200));

    // Sipping coffee
    setAgents((prev) =>
      prev.map((a) =>
        a.state === 'WALKING'
          ? { ...a, state: 'DRINKING_COFFEE', message: 'Sipping espresso ☕' }
          : a
      )
    );
    await new Promise((r) => setTimeout(r, 1600));

    // Return to desks
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        state: 'WALKING',
        currentX: a.deskX,
        currentY: a.deskY,
        message: 'Returning to Desk',
      }))
    );
    await new Promise((r) => setTimeout(r, 1200));

    // All idle
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        state: 'IDLE',
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
              <span>12-Agent Autonomous Office Simulation</span>
            </div>
          </div>

          {/* View Modes */}
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

            {/* Token Budget Meter */}
            <div className={`token-counter-pill ${tokensRemaining < 100 ? 'low' : ''}`}>
              <span className="tok-label">TOKENS:</span>
              <span className="tok-num">{tokensRemaining}</span>
              <button className="recharge-quick-btn" onClick={handleRechargeTokens} title="Recharge +500">
                ⚡ +500
              </button>
            </div>
          </div>
        </header>

        {/* ── 2. DYNAMIC 2D PIXEL-ART OFFICE FLOOR ─────────────── */}
        <main className="viewport-container">
          <div className="pixel-office-stage" style={{ width: viewMode === 'split' ? '50%' : '100%' }}>
            {/* Isometric Wood Flooring */}
            <div className="office-flooring" />

            {/* Zone 1: Executive Office (Top-Left) */}
            <div className="exec-room-border">
              <span className="exec-room-label">🏢 MICHAEL&apos;S OFFICE</span>
            </div>

            {/* Zone 2: Coffee Break Lounge (Top-Right) */}
            <div className="coffee-lounge-area">
              <span className="coffee-bar-label">☕ COFFEE LOUNGE</span>
              <div className="coffee-bar-counter">
                <span>☕</span>
                <span>♨️</span>
                <span>🧃</span>
              </div>
            </div>

            {/* Zone 3: Server Rack / Deploy Station (Bottom-Right) */}
            <div className="server-rack-zone">
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.38rem', color: '#14b8a6' }}>
                🌐 SERVER RACK
              </span>
              <div className="server-rack-unit">
                <div className="server-led-strip">
                  <div className="server-led" />
                  <div className="server-led" />
                  <div className="server-led" />
                </div>
                <div className="server-led-strip">
                  <div className="server-led" />
                  <div className="server-led" />
                  <div className="server-led" />
                </div>
              </div>
            </div>

            {/* 12 Workstation Desks (Fixed Locations) */}
            {INITIAL_AGENTS.map((agent) => (
              <div
                key={`desk-${agent.id}`}
                className="office-desk-station"
                style={{ left: `${agent.deskX}%`, top: `${agent.deskY}%` }}
              >
                <div className="desk-monitor">&gt;_</div>
                <div className="desk-chair" />
              </div>
            ))}

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

            {/* 12 Dynamic Animated Character Sprites */}
            {agents.map((agent) => {
              const isTyping = agent.state === 'TYPING';
              const isCoffee = agent.state === 'DRINKING_COFFEE';
              const isOutOfTokens = agent.state === 'OUT_OF_TOKENS';

              return (
                <div
                  key={agent.id}
                  className={`pixel-agent-entity ${agent.state}`}
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
                  {/* Speech Bubble */}
                  {isTyping && <div className="agent-status-bubble typing">{agent.message}</div>}
                  {isCoffee && <div className="agent-status-bubble coffee">{agent.message}</div>}
                  {isOutOfTokens && <div className="agent-status-bubble out_of_tokens">{agent.message}</div>}
                  {agent.state === 'WALKING' && <div className="agent-status-bubble typing">{agent.message}</div>}

                  {/* Character Body Construction */}
                  <div className="sprite-avatar-box">
                    {/* Hair */}
                    <div className="sprite-hair" style={{ backgroundColor: agent.hairColor }} />
                    {/* Head */}
                    <div className="sprite-head" />
                    {/* Torso / Outfit */}
                    <div className="sprite-torso" style={{ backgroundColor: agent.shirtColor }}>
                      <div className="sprite-hands" />
                    </div>
                    {/* Legs */}
                    <div className="sprite-legs" />
                  </div>

                  {/* Name Tag */}
                  <div className="agent-name-tag">{agent.name}</div>
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
                <div>[SYSTEM] 12BOT Cluster Online · 12 Autonomous Agents Active</div>
                <div>[TOKENS] Remaining budget: {tokensRemaining} tokens</div>
                {agents.map((a) => (
                  <div key={a.id} style={{ marginTop: '8px' }}>
                    <span style={{ color: a.shirtColor, fontWeight: 'bold' }}>[{a.name}]</span> {a.role}: {a.message} (Tokens: {a.tokensUsed})
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
              <button
                className="banner-action-btn"
                onClick={() => { sound.playClick(); setViewMode('split'); }}
              >
                SPLIT PREVIEW
              </button>
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
                  <span style={{ fontSize: '0.45rem', color: selectedAgent.shirtColor }}>{selectedAgent.role}</span>
                </h3>
                <button className="close-btn" onClick={() => setSelectedAgent(null)}>
                  ✕
                </button>
              </div>

              <div className="agent-stats-card">
                <div className="stat-item">
                  <span className="k">Role:</span>
                  <span className="v">{selectedAgent.role}</span>
                </div>
                <div className="stat-item">
                  <span className="k">State:</span>
                  <span className="v" style={{ color: selectedAgent.shirtColor }}>
                    {selectedAgent.state}
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
