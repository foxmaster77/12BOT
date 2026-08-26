import React, { useState, useEffect } from 'react';
import Head from 'next/head';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  model: string;
  status: 'idle' | 'working' | 'on_break' | 'done' | 'out_of_tokens';
  message: string;
  x: number; // percentage coordinate
  y: number; // percentage coordinate
  tokensUsed: number;
}

// 12 Exact Desk Coordinates matching the 12 Chairs in the pixel-art room
const INITIAL_AGENTS: AgentInfo[] = [
  // Top Row Desks (6 chairs: 3 pairs)
  { id: 'pm', name: 'A01 PM', role: 'Project Manager / Brain', model: 'Groq (Qwen 3.6)', status: 'idle', message: 'Ready for brief', x: 27.8, y: 29.5, tokensUsed: 0 },
  { id: 'idea', name: 'A02 Idea', role: 'Idea & Copywriter', model: 'Gemini 2.0 Flash', status: 'idle', message: 'Waiting for concept', x: 37.8, y: 29.5, tokensUsed: 0 },
  { id: 'designer', name: 'A03 Design', role: 'UI/UX Designer', model: 'Gemini 2.0 Flash', status: 'idle', message: 'Palettes ready', x: 44.8, y: 29.5, tokensUsed: 0 },
  { id: 'html_dev', name: 'A04 HTML', role: 'HTML5 Semantic Dev', model: 'Groq (Qwen 3.6)', status: 'idle', message: 'Markup ready', x: 54.8, y: 29.5, tokensUsed: 0 },
  { id: 'css_dev', name: 'A05 CSS', role: 'CSS3 Stylesheet Dev', model: 'Gemini 2.0 Flash', status: 'idle', message: 'CSS tokens ready', x: 62.4, y: 29.5, tokensUsed: 0 },
  { id: 'js_dev', name: 'A06 JS', role: 'JavaScript Interactivity', model: 'Groq (Qwen 3.6)', status: 'idle', message: 'DOM scripts ready', x: 72.8, y: 29.5, tokensUsed: 0 },

  // Bottom Row Desks (6 chairs: 3 pairs)
  { id: 'animation_dev', name: 'A07 Anim', role: 'Animation Developer', model: 'Gemini 2.0 Flash', status: 'idle', message: 'Keyframes ready', x: 24.2, y: 56.5, tokensUsed: 0 },
  { id: 'backend_dev', name: 'A08 Back', role: 'Express Backend Dev', model: 'Groq (Qwen 3.6)', status: 'idle', message: 'Server API ready', x: 35.2, y: 56.5, tokensUsed: 0 },
  { id: 'db_dev', name: 'A09 DB', role: 'Database & SQL Dev', model: 'Gemini 2.0 Flash', status: 'idle', message: 'Schema ready', x: 44.2, y: 56.5, tokensUsed: 0 },
  { id: 'debugger_1', name: 'A10 QA-1', role: 'Frontend Debugger', model: 'Groq (Qwen 3.6)', status: 'idle', message: 'Linter ready', x: 54.8, y: 56.5, tokensUsed: 0 },
  { id: 'debugger_2', name: 'A11 QA-2', role: 'System Review QA', model: 'Gemini 2.0 Flash', status: 'idle', message: 'QA test ready', x: 62.4, y: 56.5, tokensUsed: 0 },
  { id: 'docs_writer', name: 'A12 Docs', role: 'Documentation Dev', model: 'Groq (Qwen 3.6)', status: 'idle', message: 'README ready', x: 72.8, y: 56.5, tokensUsed: 0 },
];

const NICHE_PROMPTS: Record<string, string> = {
  App: 'Build a modern responsive web app for habit tracking with streaks, dark mode, and interactive charts.',
  Website: 'Build a high-end dark-themed portfolio site for a wildlife photographer named LUMEN.',
  Dashboard: 'Build an analytics SaaS dashboard with real-time KPI metrics, dark glassmorphism, and revenue tables.',
  Game: 'Build a retro 16-bit browser arcade game with canvas scoreboards, sounds, and particle FX.',
};

export default function OrchestraInterface() {
  const [isDayMode, setIsDayMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('Processing...');
  const [selectedNiche, setSelectedNiche] = useState('Website');
  const [projectName, setProjectName] = useState('LUMEN Portfolio');
  const [prompt, setPrompt] = useState(NICHE_PROMPTS['Website']);
  const [tokensRemaining, setTokensRemaining] = useState(500);
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

  // When Niche changes, update default prompt & project name
  const handleSelectNiche = (niche: string) => {
    setSelectedNiche(niche);
    setPrompt(NICHE_PROMPTS[niche] || '');
    setProjectName(`${niche} Studio Pro`);
  };

  // Top up token balance
  const handleRechargeTokens = () => {
    setTokensRemaining((prev) => prev + 500);
    setAgents((prev) =>
      prev.map((a) => (a.status === 'out_of_tokens' ? { ...a, status: 'idle', message: 'Restored & Ready' } : a))
    );
  };

  // Trigger 12BOT Live Workflow
  const handleGenerate = async () => {
    if (isProcessing) return;

    if (tokensRemaining <= 0) {
      setAgents((prev) =>
        prev.map((a) => ({ ...a, status: 'out_of_tokens', message: 'Tokens Exhausted! 🪫' }))
      );
      alert('Tokens exhausted! Click "⚡ Top Up" in the header to recharge.');
      return;
    }

    setIsProcessing(true);
    setDeployUrl(null);
    setTokensRemaining((prev) => Math.max(0, prev - 60));

    // Sequential multi-agent execution pipeline simulation
    const stages = [
      { id: 'pm', stage: 'Planning Architecture...', msg: 'Planning site breakdown 💡' },
      { id: 'idea', stage: 'Drafting Copywriting...', msg: 'Crafting sitemap & copy ✍️' },
      { id: 'designer', stage: 'Creating UI Spec...', msg: 'Generating dark theme 🎨' },
      { id: 'html_dev', stage: 'Writing HTML Markup...', msg: 'Writing index.html 📄' },
      { id: 'css_dev', stage: 'Styling Responsive CSS...', msg: 'Writing styles.css 💅' },
      { id: 'js_dev', stage: 'Adding Interactivity...', msg: 'Writing script.js ⚡' },
      { id: 'animation_dev', stage: 'Adding Micro-Animations...', msg: 'Adding scroll reveals ✨' },
      { id: 'backend_dev', stage: 'Building API Endpoints...', msg: 'Writing server.js 🚀' },
      { id: 'db_dev', stage: 'Designing SQL Schema...', msg: 'Writing schema.sql 🗄️' },
      { id: 'debugger_1', stage: 'Frontend QA Pass...', msg: 'Checking HTML/CSS/JS 🔍' },
      { id: 'debugger_2', stage: 'Final Review Pass...', msg: 'Full site brief review ✓' },
      { id: 'docs_writer', stage: 'Generating Docs...', msg: 'Writing README.md 📚' },
    ];

    // Try triggering real orchestrator backend if available
    fetch('http://localhost:4000/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: `[${selectedNiche}] ${prompt}`, isMock: true }),
    })
      .then((res) => res.json())
      .then(() => {
        setDeployUrl('http://localhost:4002');
      })
      .catch(() => {
        // Standalone preview fallback
        setDeployUrl('http://localhost:4000/preview/index.html');
      });

    // Run dynamic agent visual sequence
    for (let i = 0; i < stages.length; i++) {
      const { id, stage, msg } = stages[i];
      setProcessingStage(stage);

      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              status: 'working',
              message: msg,
              tokensUsed: a.tokensUsed + 45,
            };
          }
          return a;
        })
      );

      // 400ms per agent task
      await new Promise((r) => setTimeout(r, 420));

      // Mark agent done
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'done', message: 'Task Completed ✓' } : a))
      );
    }

    // Step 2: Agents take a coffee break!
    setProcessingStage('Coffee Break...');
    setAgents((prev) =>
      prev.map((a, idx) =>
        idx % 2 === 0
          ? { ...a, status: 'on_break', message: 'Sipping coffee ☕' }
          : { ...a, status: 'idle', message: 'Standing by' }
      )
    );

    await new Promise((r) => setTimeout(r, 1200));

    // Reset all to idle & finished
    setAgents((prev) =>
      prev.map((a) => ({ ...a, status: 'idle', message: 'Ready for next task' }))
    );
    setIsProcessing(false);
    setDeployUrl('http://localhost:4002');
  };

  return (
    <>
      <Head>
        <title>Orchestra2D — 12BOT AI Dev Team</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="orchestra-app">
        {/* ── 1. HEADER ─────────────────────────────────────────────────── */}
        <header className="app-header">
          <div className="header-left-cluster">
            <div className="logo-icon">
              <span>(†!†)</span>
            </div>
            <h1>Orchestra2D Generator Interface</h1>
          </div>

          <div className="header-right-cluster">
            {/* Live Token Budget Counter */}
            <div className={`token-counter-pill ${tokensRemaining < 100 ? 'low' : ''}`}>
              <span>Tokens:</span>
              <span>{tokensRemaining}</span>
              <button className="recharge-quick-btn" onClick={handleRechargeTokens} title="Recharge +500 tokens">
                ⚡ +500
              </button>
            </div>

            {/* Day / Night Mode Switcher */}
            <button className="theme-toggle" onClick={() => setIsDayMode(!isDayMode)}>
              Toggle {isDayMode ? 'Night 🌙' : 'Day ☀️'} Mode
            </button>
          </div>
        </header>

        {/* ── 2. MAIN VIEWPORT (HD Room with Dynamic 12 Agents) ─────────── */}
        <main className="viewport-container">
          <div className={`pixel-room-canvas ${isDayMode ? 'day-bg' : 'night-bg'}`} />

          {/* Ambient Sunlight Beam (Day mode only) */}
          {isDayMode && <div className="sunlight-beam" />}

          {/* Steaming Coffee Bar Particles (Top-Right Coffee Machine) */}
          <div className="coffee-steam-emitter">
            <span className="steam-cloud">♨️</span>
            <span className="steam-cloud">♨️</span>
          </div>

          {/* Live Deployment Banner */}
          {deployUrl && (
            <div className="live-deploy-banner">
              <span>🚀 Site Live & Deployed:</span>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                {deployUrl}
              </a>
              <span>↗</span>
            </div>
          )}

          {/* ── 12 Interactive Agent Hotspots ───────────────────────────── */}
          {agents.map((agent) => {
            const isWorking = agent.status === 'working';
            const isOnBreak = agent.status === 'on_break';
            const isOutOfTokens = agent.status === 'out_of_tokens';

            return (
              <div
                key={agent.id}
                className={`agent-interactive-hotspot ${agent.status}`}
                style={{
                  left: `${agent.x}%`,
                  top: `${agent.y}%`,
                }}
                onClick={() => setSelectedAgent(agent)}
                title={`Click to inspect ${agent.name} (${agent.role})`}
              >
                {/* Glowing Monitor when Coding */}
                <div className="monitor-coding-glow" />

                {/* Live Floating Speech Bubble */}
                {isWorking && (
                  <div className="agent-speech-bubble typing">{agent.message}</div>
                )}
                {isOnBreak && (
                  <div className="agent-speech-bubble coffee">{agent.message}</div>
                )}
                {isOutOfTokens && (
                  <div className="agent-speech-bubble out_of_tokens">{agent.message}</div>
                )}
                {agent.status === 'done' && (
                  <div className="agent-speech-bubble done">{agent.message}</div>
                )}

                {/* Subtle Agent Tag */}
                <div className="agent-tag-badge">{agent.id.toUpperCase()}</div>
              </div>
            );
          })}
        </main>

        {/* ── 3. BOTTOM CONTROL PANEL (Generator HUD) ───────────────────── */}
        <footer className="control-panel">
          {/* Section 1: Project Info */}
          <div className="panel-section info-section">
            <h2>Current Project Info</h2>
            <div className="info-box">
              <p>
                <span className="label">Niche:</span>
                <span className="val">[{selectedNiche}]</span>
              </p>
              <p>
                <span className="label">Project:</span>
                <span className="val">[{projectName}]</span>
              </p>
            </div>
          </div>

          {/* Section 2: Prompt Input */}
          <div className="panel-section prompt-section">
            <h2>Prompt</h2>
            <textarea
              placeholder="Enter your prompt here..."
              className="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Section 3: Niche Selector */}
          <div className="panel-section niche-section">
            <h2>Niche</h2>
            <div className="niche-list">
              {['App', 'Website', 'Dashboard', 'Game'].map((niche) => (
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

          {/* Section 4: Generate Action */}
          <div className="panel-section action-section">
            {isProcessing && (
              <span className="processing-text">{processingStage}</span>
            )}
            <button
              className={`generate-btn ${isProcessing ? 'processing' : ''}`}
              onClick={handleGenerate}
              disabled={isProcessing}
            >
              {isProcessing ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </footer>

        {/* ── 4. AGENT INSPECTION MODAL DRAWER ─────────────────────────── */}
        {selectedAgent && (
          <div className="agent-drawer-backdrop" onClick={() => setSelectedAgent(null)}>
            <div className="agent-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-top">
                <h3>{selectedAgent.name}</h3>
                <button className="close-btn" onClick={() => setSelectedAgent(null)}>
                  ✕
                </button>
              </div>

              <div className="agent-stats-card">
                <div className="stat-item">
                  <span className="k">Specialization:</span>
                  <span className="v">{selectedAgent.role}</span>
                </div>
                <div className="stat-item">
                  <span className="k">LLM Model:</span>
                  <span className="v">{selectedAgent.model}</span>
                </div>
                <div className="stat-item">
                  <span className="k">Live Status:</span>
                  <span className="v" style={{ color: selectedAgent.status === 'working' ? '#22c55e' : '#38bdf8' }}>
                    {selectedAgent.status.toUpperCase()}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="k">Current Activity:</span>
                  <span className="v">{selectedAgent.message}</span>
                </div>
                <div className="stat-item">
                  <span className="k">Tokens Used:</span>
                  <span className="v">{selectedAgent.tokensUsed} tokens</span>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#94a3b8', marginTop: '4px' }}>
                Active Agent Output & Logs
              </div>
              <div className="drawer-terminal">
                <div>[SYSTEM] Agent {selectedAgent.id} online and initialized.</div>
                <div>[ROLE] Assigned to {selectedAgent.role}.</div>
                <div>[STATUS] {selectedAgent.message}</div>
                {selectedAgent.tokensUsed > 0 && (
                  <div>[METRICS] Cumulative execution tokens: {selectedAgent.tokensUsed}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
