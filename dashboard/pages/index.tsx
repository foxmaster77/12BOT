import React, { useState } from 'react';
import Head from 'next/head';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  model: string;
  status: 'idle' | 'working' | 'on_break' | 'done' | 'out_of_tokens';
  message: string;
  x: number;
  y: number;
  tokensUsed: number;
}

const INITIAL_AGENTS: AgentInfo[] = [
  { id: 'pm',            name: 'PM',     role: 'Project Manager',       model: 'Groq / Qwen-3',       status: 'idle', message: 'Ready for brief',      x: 27.8, y: 29.5, tokensUsed: 0 },
  { id: 'idea',          name: 'Idea',   role: 'Idea & Copywriter',     model: 'Gemini 2.0 Flash',    status: 'idle', message: 'Waiting for concept',   x: 37.8, y: 29.5, tokensUsed: 0 },
  { id: 'designer',      name: 'Design', role: 'UI/UX Designer',        model: 'Gemini 2.0 Flash',    status: 'idle', message: 'Palettes ready',        x: 44.8, y: 29.5, tokensUsed: 0 },
  { id: 'html_dev',      name: 'HTML',   role: 'HTML5 Developer',       model: 'Groq / Qwen-3',       status: 'idle', message: 'Markup ready',          x: 54.8, y: 29.5, tokensUsed: 0 },
  { id: 'css_dev',       name: 'CSS',    role: 'CSS3 Developer',        model: 'Gemini 2.0 Flash',    status: 'idle', message: 'Styles ready',          x: 62.4, y: 29.5, tokensUsed: 0 },
  { id: 'js_dev',        name: 'JS',     role: 'JavaScript Developer',  model: 'Groq / Qwen-3',       status: 'idle', message: 'Scripts ready',         x: 72.8, y: 29.5, tokensUsed: 0 },
  { id: 'animation_dev', name: 'Anim',   role: 'Animation Developer',   model: 'Gemini 2.0 Flash',    status: 'idle', message: 'Keyframes ready',       x: 24.2, y: 56.5, tokensUsed: 0 },
  { id: 'backend_dev',   name: 'Back',   role: 'Express Backend Dev',   model: 'Groq / Qwen-3',       status: 'idle', message: 'Server API ready',      x: 35.2, y: 56.5, tokensUsed: 0 },
  { id: 'db_dev',        name: 'DB',     role: 'Database & SQL Dev',    model: 'Gemini 2.0 Flash',    status: 'idle', message: 'Schema ready',          x: 44.2, y: 56.5, tokensUsed: 0 },
  { id: 'debugger_1',    name: 'QA-1',   role: 'Frontend Debugger',     model: 'Groq / Qwen-3',       status: 'idle', message: 'Linter ready',          x: 54.8, y: 56.5, tokensUsed: 0 },
  { id: 'debugger_2',    name: 'QA-2',   role: 'System Review QA',      model: 'Gemini 2.0 Flash',    status: 'idle', message: 'QA test ready',         x: 62.4, y: 56.5, tokensUsed: 0 },
  { id: 'docs_writer',   name: 'Docs',   role: 'Documentation Writer',  model: 'Groq / Qwen-3',       status: 'idle', message: 'README ready',          x: 72.8, y: 56.5, tokensUsed: 0 },
];

const NICHE_PROMPTS: Record<string, string> = {
  App:       'Build a modern responsive web app for habit tracking with streaks, dark mode, and interactive charts.',
  Website:   'Build a high-end dark-themed portfolio site for a wildlife photographer named LUMEN.',
  Dashboard: 'Build an analytics SaaS dashboard with real-time KPI metrics, dark glassmorphism, and revenue tables.',
  Game:      'Build a retro 16-bit browser arcade game with canvas scoreboards, sounds, and particle FX.',
};

const NICHE_PROJECT: Record<string, string> = {
  App:       'Habit Tracker App',
  Website:   'LUMEN Portfolio',
  Dashboard: 'Analytics SaaS',
  Game:      'Retro Arcade Game',
};

export default function OrchestraInterface() {
  const [isDayMode, setIsDayMode]           = useState(true);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [selectedNiche, setSelectedNiche]   = useState('Website');
  const [prompt, setPrompt]                 = useState(NICHE_PROMPTS['Website']);
  const [tokensRemaining, setTokensRemaining] = useState(500);
  const [agents, setAgents]                 = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent]   = useState<AgentInfo | null>(null);
  const [deployUrl, setDeployUrl]           = useState<string | null>(null);

  const handleSelectNiche = (niche: string) => {
    setSelectedNiche(niche);
    setPrompt(NICHE_PROMPTS[niche] ?? '');
  };

  const handleRechargeTokens = () => {
    setTokensRemaining((t) => t + 500);
    setAgents((prev) =>
      prev.map((a) => (a.status === 'out_of_tokens' ? { ...a, status: 'idle', message: 'Restored ✓' } : a))
    );
  };

  const handleGenerate = async () => {
    if (isProcessing) return;

    if (tokensRemaining <= 0) {
      setAgents((prev) => prev.map((a) => ({ ...a, status: 'out_of_tokens', message: 'Tokens Exhausted 🪫' })));
      return;
    }

    setIsProcessing(true);
    setDeployUrl(null);
    setTokensRemaining((t) => Math.max(0, t - 60));

    const stages = [
      { id: 'pm',            stage: 'Planning architecture…',    msg: 'Breaking down brief 💡' },
      { id: 'idea',          stage: 'Drafting copy & sitemap…',  msg: 'Writing copy ✍️' },
      { id: 'designer',      stage: 'Generating UI spec…',       msg: 'Dark palette 🎨' },
      { id: 'html_dev',      stage: 'Writing HTML markup…',      msg: 'index.html 📄' },
      { id: 'css_dev',       stage: 'Styling responsive CSS…',   msg: 'styles.css 💅' },
      { id: 'js_dev',        stage: 'Adding interactivity…',     msg: 'script.js ⚡' },
      { id: 'animation_dev', stage: 'Adding micro-animations…',  msg: 'Scroll reveals ✨' },
      { id: 'backend_dev',   stage: 'Building API endpoints…',   msg: 'server.js 🚀' },
      { id: 'db_dev',        stage: 'Designing SQL schema…',     msg: 'schema.sql 🗄️' },
      { id: 'debugger_1',    stage: 'Frontend QA pass…',         msg: 'Checking HTML/CSS 🔍' },
      { id: 'debugger_2',    stage: 'Final review pass…',        msg: 'Full review ✓' },
      { id: 'docs_writer',   stage: 'Generating docs…',          msg: 'README.md 📚' },
    ];

    for (const { id, stage, msg } of stages) {
      setProcessingStage(stage);
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'working', message: msg, tokensUsed: a.tokensUsed + 45 } : a))
      );
      await new Promise((r) => setTimeout(r, 420));
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'done', message: 'Done ✓' } : a))
      );
    }

    // Coffee break
    setProcessingStage('Coffee break ☕');
    setAgents((prev) =>
      prev.map((a, i) => (i % 2 === 0 ? { ...a, status: 'on_break', message: 'Sipping ☕' } : { ...a, status: 'idle', message: 'Standing by' }))
    );
    await new Promise((r) => setTimeout(r, 1200));

    setAgents((prev) => prev.map((a) => ({ ...a, status: 'idle', message: 'Ready for next task' })));
    setIsProcessing(false);
    setProcessingStage('');
    setDeployUrl('http://localhost:4002');
  };

  return (
    <>
      <Head>
        <title>Orchestra2D — 12BOT AI Dev Team</title>
      </Head>

      {/* Root shell: flex column, fills the screen */}
      <div className="orchestra-app">

        {/* ── 1. TOP HEADER ─────────────────────────────────────────────── */}
        <header className="app-header">
          <div className="header-left-cluster">
            <div className="logo-icon">(†!†)</div>
            <h1>Orchestra2D Generator Interface</h1>
          </div>

          <div className="header-right-cluster">
            <div className={`token-counter-pill${tokensRemaining < 100 ? ' low' : ''}`}>
              <span>Tokens: {tokensRemaining}</span>
              <button className="recharge-quick-btn" onClick={handleRechargeTokens} title="Top up +500 tokens">
                ⚡ +500
              </button>
            </div>

            <button className="theme-toggle" onClick={() => setIsDayMode((d) => !d)}>
              {isDayMode ? '🌙 Night Mode' : '☀️ Day Mode'}
            </button>
          </div>
        </header>

        {/* ── 2. PIXEL-ART VIEWPORT (grows to fill space between header & footer) */}
        <main className="viewport-container">
          {/* Background room image */}
          <div className={`pixel-room-canvas ${isDayMode ? 'day-bg' : 'night-bg'}`} />

          {/* Ambient day sunlight */}
          {isDayMode && <div className="sunlight-beam" />}

          {/* Coffee steam */}
          <div className="coffee-steam-emitter">
            <span className="steam-cloud">♨</span>
            <span className="steam-cloud">♨</span>
          </div>

          {/* Live deploy banner */}
          {deployUrl && (
            <div className="live-deploy-banner">
              <span>🚀 Site deployed:</span>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer">{deployUrl} ↗</a>
            </div>
          )}

          {/* 12 Agent hotspots */}
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`agent-interactive-hotspot ${agent.status}`}
              style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
              onClick={() => setSelectedAgent(agent)}
              title={`${agent.name} — ${agent.role}`}
            >
              <div className="monitor-coding-glow" />

              {agent.status === 'working'       && <div className="agent-speech-bubble typing">{agent.message}</div>}
              {agent.status === 'on_break'      && <div className="agent-speech-bubble coffee">{agent.message}</div>}
              {agent.status === 'out_of_tokens' && <div className="agent-speech-bubble out_of_tokens">{agent.message}</div>}
              {agent.status === 'done'          && <div className="agent-speech-bubble done">{agent.message}</div>}
            </div>
          ))}
        </main>

        {/* ── 3. BOTTOM GENERATOR HUD ──────────────────────────────────── */}
        <footer className="control-panel">

          {/* Project Info */}
          <div className="panel-section info-section">
            <h2>Current Project</h2>
            <div className="info-box">
              <p><span className="label">Niche:</span>   <span className="val">[{selectedNiche}]</span></p>
              <p><span className="label">Project:</span> <span className="val">[{NICHE_PROJECT[selectedNiche]}]</span></p>
            </div>
          </div>

          {/* Prompt */}
          <div className="panel-section prompt-section">
            <h2>Prompt</h2>
            <textarea
              className="prompt-input"
              placeholder="Enter your prompt here…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Niche Picker */}
          <div className="panel-section niche-section">
            <h2>Niche</h2>
            <div className="niche-list">
              {['App', 'Website', 'Dashboard', 'Game'].map((niche) => (
                <div
                  key={niche}
                  className={`niche-item${selectedNiche === niche ? ' active' : ''}`}
                  onClick={() => handleSelectNiche(niche)}
                >
                  {niche}
                </div>
              ))}
            </div>
          </div>

          {/* Generate */}
          <div className="panel-section action-section">
            {isProcessing && <span className="processing-text">{processingStage}</span>}
            <button
              className={`generate-btn${isProcessing ? ' processing' : ''}`}
              onClick={handleGenerate}
              disabled={isProcessing}
            >
              {isProcessing ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </footer>

        {/* ── 4. AGENT INSPECT DRAWER ──────────────────────────────────── */}
        {selectedAgent && (
          <div className="agent-drawer-backdrop" onClick={() => setSelectedAgent(null)}>
            <div className="agent-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-top">
                <h3>{selectedAgent.name} — {selectedAgent.role}</h3>
                <button className="close-btn" onClick={() => setSelectedAgent(null)}>✕</button>
              </div>

              <div className="agent-stats-card">
                <div className="stat-item"><span className="k">Model:</span>       <span className="v">{selectedAgent.model}</span></div>
                <div className="stat-item"><span className="k">Status:</span>      <span className="v" style={{ color: selectedAgent.status === 'working' ? '#22c55e' : '#38bdf8' }}>{selectedAgent.status.toUpperCase()}</span></div>
                <div className="stat-item"><span className="k">Activity:</span>    <span className="v">{selectedAgent.message}</span></div>
                <div className="stat-item"><span className="k">Tokens used:</span> <span className="v">{selectedAgent.tokensUsed}</span></div>
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>Live Output</div>
              <div className="drawer-terminal">
                <div>&gt; [BOOT] {selectedAgent.id} agent initialized.</div>
                <div>&gt; [ROLE] {selectedAgent.role}</div>
                <div>&gt; [STATUS] {selectedAgent.message}</div>
                {selectedAgent.tokensUsed > 0 && <div>&gt; [TOKENS] {selectedAgent.tokensUsed} tokens consumed.</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
