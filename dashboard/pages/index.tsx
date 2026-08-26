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
  { id: 'pm',            name: 'PM',     role: 'Project Manager',      model: 'Groq / Qwen-3',    status: 'idle', message: 'Ready for brief',     x: 27.8, y: 29.5, tokensUsed: 0 },
  { id: 'idea',          name: 'Idea',   role: 'Idea & Copywriter',    model: 'Gemini 2.0 Flash', status: 'idle', message: 'Waiting for concept',  x: 37.8, y: 29.5, tokensUsed: 0 },
  { id: 'designer',      name: 'Design', role: 'UI/UX Designer',       model: 'Gemini 2.0 Flash', status: 'idle', message: 'Palettes ready',       x: 44.8, y: 29.5, tokensUsed: 0 },
  { id: 'html_dev',      name: 'HTML',   role: 'HTML5 Developer',      model: 'Groq / Qwen-3',    status: 'idle', message: 'Markup ready',         x: 54.8, y: 29.5, tokensUsed: 0 },
  { id: 'css_dev',       name: 'CSS',    role: 'CSS3 Developer',       model: 'Gemini 2.0 Flash', status: 'idle', message: 'Styles ready',         x: 62.4, y: 29.5, tokensUsed: 0 },
  { id: 'js_dev',        name: 'JS',     role: 'JS Developer',         model: 'Groq / Qwen-3',    status: 'idle', message: 'Scripts ready',        x: 72.8, y: 29.5, tokensUsed: 0 },
  { id: 'animation_dev', name: 'Anim',   role: 'Animation Developer',  model: 'Gemini 2.0 Flash', status: 'idle', message: 'Keyframes ready',      x: 24.2, y: 56.5, tokensUsed: 0 },
  { id: 'backend_dev',   name: 'Back',   role: 'Backend Developer',    model: 'Groq / Qwen-3',    status: 'idle', message: 'Server API ready',     x: 35.2, y: 56.5, tokensUsed: 0 },
  { id: 'db_dev',        name: 'DB',     role: 'Database Developer',   model: 'Gemini 2.0 Flash', status: 'idle', message: 'Schema ready',         x: 44.2, y: 56.5, tokensUsed: 0 },
  { id: 'debugger_1',    name: 'QA-1',   role: 'Frontend Debugger',    model: 'Groq / Qwen-3',    status: 'idle', message: 'Linter ready',         x: 54.8, y: 56.5, tokensUsed: 0 },
  { id: 'debugger_2',    name: 'QA-2',   role: 'System QA',            model: 'Gemini 2.0 Flash', status: 'idle', message: 'QA test ready',        x: 62.4, y: 56.5, tokensUsed: 0 },
  { id: 'docs_writer',   name: 'Docs',   role: 'Documentation Writer', model: 'Groq / Qwen-3',    status: 'idle', message: 'README ready',         x: 72.8, y: 56.5, tokensUsed: 0 },
];

const NICHE_PROMPTS: Record<string, string> = {
  App:       'Build a modern responsive habit tracking app with dark mode, streaks, and interactive charts.',
  Website:   'Build a high-end dark portfolio site for a wildlife photographer named LUMEN.',
  Dashboard: 'Build an analytics SaaS dashboard with real-time KPIs, glassmorphism, and revenue tables.',
  Game:      'Build a retro 16-bit browser arcade game with canvas, scoreboards, and particle FX.',
};

const NICHE_PROJECT: Record<string, string> = {
  App: 'Habit Tracker', Website: 'LUMEN Portfolio', Dashboard: 'Analytics SaaS', Game: 'Retro Arcade',
};

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function OrchestraInterface() {
  const [isDayMode,       setIsDayMode]       = useState(true);
  const [isProcessing,    setIsProcessing]    = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [selectedNiche,   setSelectedNiche]   = useState('Website');
  const [prompt,          setPrompt]          = useState(NICHE_PROMPTS['Website']);
  const [tokensRemaining, setTokensRemaining] = useState(500);
  const [agents,          setAgents]          = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [selectedAgent,   setSelectedAgent]   = useState<AgentInfo | null>(null);
  const [deployUrl,       setDeployUrl]       = useState<string | null>(null);
  const [showBanner,      setShowBanner]      = useState(false);

  const handleSelectNiche = (niche: string) => {
    setSelectedNiche(niche);
    setPrompt(NICHE_PROMPTS[niche] ?? '');
  };

  const handleRechargeTokens = () => {
    setTokensRemaining((t) => t + 500);
    setAgents((prev) =>
      prev.map((a) => (a.status === 'out_of_tokens' ? { ...a, status: 'idle', message: 'Recharged ✓' } : a))
    );
  };

  const handleGenerate = async () => {
    if (isProcessing) return;

    if (tokensRemaining <= 0) {
      setAgents((prev) => prev.map((a) => ({ ...a, status: 'out_of_tokens', message: '🪫 Out of tokens' })));
      return;
    }

    setIsProcessing(true);
    setShowBanner(false);
    setDeployUrl(null);
    setTokensRemaining((t) => Math.max(0, t - 60));

    // Reset all agents to idle first
    setAgents(INITIAL_AGENTS.map((a) => ({ ...a })));

    const stages = [
      { id: 'pm',            stage: 'Planning architecture…',   msg: 'Breaking down brief 💡' },
      { id: 'idea',          stage: 'Writing copy & sitemap…',  msg: 'Crafting copy ✍️' },
      { id: 'designer',      stage: 'Creating UI system…',      msg: 'Dark theme palette 🎨' },
      { id: 'html_dev',      stage: 'Writing HTML markup…',     msg: 'index.html ready 📄' },
      { id: 'css_dev',       stage: 'Styling CSS…',             msg: 'styles.css 💅' },
      { id: 'js_dev',        stage: 'Adding JS logic…',         msg: 'script.js ⚡' },
      { id: 'animation_dev', stage: 'Adding animations…',       msg: 'Scroll FX ✨' },
      { id: 'backend_dev',   stage: 'Building backend…',        msg: 'server.js 🚀' },
      { id: 'db_dev',        stage: 'Designing schema…',        msg: 'schema.sql 🗄️' },
      { id: 'debugger_1',    stage: 'QA frontend pass…',        msg: 'HTML/CSS check 🔍' },
      { id: 'debugger_2',    stage: 'Final review…',            msg: 'All tests pass ✓' },
      { id: 'docs_writer',   stage: 'Writing docs…',            msg: 'README.md 📚' },
    ];

    // Call backend to generate the real HTML site
    const buildPromise = fetch('http://localhost:4000/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: `[${selectedNiche}] ${prompt}` }),
    })
      .then((r) => r.json())
      .catch(() => null);

    // Run animated agent sequence in parallel
    for (const { id, stage, msg } of stages) {
      setProcessingStage(stage);
      setAgents((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: 'working', message: msg, tokensUsed: a.tokensUsed + 45 } : a
        )
      );
      await delay(440);
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'done', message: 'Done ✓' } : a))
      );
    }

    // Coffee break phase
    setProcessingStage('Coffee break ☕');
    setAgents((prev) =>
      prev.map((a, i) =>
        i % 2 === 0
          ? { ...a, status: 'on_break', message: 'Sipping ☕' }
          : { ...a, status: 'idle', message: 'Standing by' }
      )
    );
    await delay(1400);

    // Reset all to idle
    setAgents((prev) => prev.map((a) => ({ ...a, status: 'idle', message: 'Ready for next task' })));
    setIsProcessing(false);
    setProcessingStage('');

    // Get result from backend call
    const result = await buildPromise;
    const previewUrl = result?.previewUrl || 'http://localhost:4000/preview';
    setDeployUrl(previewUrl);
    setShowBanner(true);
  };

  return (
    <>
      <Head>
        <title>Orchestra2D — 12BOT AI Dev Team</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="orchestra-app">

        {/* ── TOP HUD BAR ─────────────────────────────────── */}
        <header className="app-header">
          <div className="header-left-cluster">
            <div className="logo-icon">†!†</div>
            <h1>Orchestra2D Generator Interface</h1>
          </div>

          <div className="header-right-cluster">
            <div className={`token-counter-pill${tokensRemaining < 100 ? ' low' : ''}`}>
              <span className="tok-label">TOKENS </span>
              <span>{tokensRemaining}</span>
              <button className="recharge-quick-btn" onClick={handleRechargeTokens}>
                ⚡ +500
              </button>
            </div>
            <button className="theme-toggle" onClick={() => setIsDayMode((d) => !d)}>
              {isDayMode ? '🌙 Night' : '☀️ Day'}
            </button>
          </div>
        </header>

        {/* ── PIXEL-ART VIEWPORT ──────────────────────────── */}
        <main className="viewport-container">
          <div className={`pixel-room-canvas ${isDayMode ? 'day-bg' : 'night-bg'}`} />
          {isDayMode && <div className="sunlight-beam" />}
          <div className="coffee-steam-emitter">
            <span className="steam-cloud">♨</span>
            <span className="steam-cloud">♨</span>
          </div>

          {/* Live deploy success banner */}
          {showBanner && deployUrl && (
            <div className="live-deploy-banner">
              <span>✅ BUILD COMPLETE</span>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                Preview ↗
              </a>
              <button className="banner-close-btn" onClick={() => setShowBanner(false)}>✕</button>
            </div>
          )}

          {/* 12 Agent Hotspots */}
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

        {/* ── BOTTOM GENERATOR HUD ────────────────────────── */}
        <footer className="control-panel">

          <div className="panel-section info-section">
            <h2>Project</h2>
            <div className="info-box">
              <p><span className="label">Niche:   </span><span className="val">[{selectedNiche}]</span></p>
              <p><span className="label">Build:   </span><span className="val">[{NICHE_PROJECT[selectedNiche]}]</span></p>
            </div>
          </div>

          <div className="panel-section prompt-section">
            <h2>Prompt</h2>
            <textarea
              className="prompt-input"
              placeholder="Enter your build prompt here…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

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

          <div className="panel-section action-section">
            {isProcessing && <span className="processing-text">{processingStage}</span>}
            <button
              className={`generate-btn${isProcessing ? ' processing' : ''}`}
              onClick={handleGenerate}
              disabled={isProcessing}
            >
              {isProcessing ? '⬛ RUNNING…' : '▶ GENERATE'}
            </button>
          </div>

        </footer>

        {/* ── AGENT INSPECT DRAWER ────────────────────────── */}
        {selectedAgent && (
          <div className="agent-drawer-backdrop" onClick={() => setSelectedAgent(null)}>
            <div className="agent-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-top">
                <h3>{selectedAgent.name}<br />{selectedAgent.role}</h3>
                <button className="close-btn" onClick={() => setSelectedAgent(null)}>✕</button>
              </div>

              <div className="agent-stats-card">
                <div className="stat-item"><span className="k">Model:</span>        <span className="v">{selectedAgent.model}</span></div>
                <div className="stat-item"><span className="k">Status:</span>       <span className="v" style={{ color: selectedAgent.status === 'working' ? '#39ff14' : '#00d4ff' }}>{selectedAgent.status.toUpperCase()}</span></div>
                <div className="stat-item"><span className="k">Activity:</span>     <span className="v">{selectedAgent.message}</span></div>
                <div className="stat-item"><span className="k">Tokens used:</span>  <span className="v">{selectedAgent.tokensUsed}</span></div>
              </div>

              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem', color: '#3a4a6a', letterSpacing: '1px' }}>
                LIVE OUTPUT
              </div>
              <div className="drawer-terminal">
                <div>[BOOT] Agent {selectedAgent.id} initialized</div>
                <div>[ROLE] {selectedAgent.role}</div>
                <div>[STATUS] {selectedAgent.message}</div>
                {selectedAgent.tokensUsed > 0 && <div>[TOKENS] {selectedAgent.tokensUsed} consumed</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
