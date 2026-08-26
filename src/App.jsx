import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import PixelOffice from './components/PixelOffice';
import './styles/PixelOffice.css';

const SOCKET_SERVER_URL = 'http://localhost:4000';
const NICHES = ['App', 'Website', 'Dashboard', 'Game'];

export default function App() {
  const [socket, setSocket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [tokensRemaining, setTokensRemaining] = useState(500);
  const [isDayMode, setIsDayMode] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState('App');
  const [projectName, setProjectName] = useState('New Project');
  const [prompt, setPrompt] = useState('Build a high-end dark-themed portfolio site for a wildlife photographer named LUMEN.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('[Socket.io] Connected to 12BOT Engine:', s.id);
    });

    // Initial snapshot
    s.on('initial_state', (data) => {
      if (data.tokensRemaining !== undefined) {
        setTokensRemaining(data.tokensRemaining);
      }
      if (Array.isArray(data.agents)) {
        setAgents(data.agents);
      }
    });

    // Token budget updates
    s.on('token_update', (data) => {
      if (data.tokensRemaining !== undefined) {
        setTokensRemaining(data.tokensRemaining);
      }
    });

    // Agent status transitions & walking interpolation
    s.on('agent_status', (data) => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id === data.agentId) {
            return {
              ...agent,
              state: data.state,
              message: data.message || agent.message,
              currentX: data.currentX !== undefined ? data.currentX : agent.currentX,
              currentY: data.currentY !== undefined ? data.currentY : agent.currentY,
            };
          }
          return agent;
        })
      );

      // Keep selected agent drawer up to date
      setSelectedAgent((current) => {
        if (current && current.id === data.agentId) {
          return {
            ...current,
            state: data.state,
            message: data.message || current.message,
          };
        }
        return current;
      });

      // Reset processing flag when task cycle reaches IDLE
      if (data.state === 'IDLE' || data.state === 'OUT_OF_TOKENS') {
        setIsProcessing(false);
      }
    });

    // Live terminal logs from backend
    s.on('task_log', (data) => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id === data.agentId) {
            const logs = agent.logs || [];
            return {
              ...agent,
              logs: [...logs, `[${new Date().toLocaleTimeString()}] ${data.log}`],
            };
          }
          return agent;
        })
      );

      setSelectedAgent((current) => {
        if (current && current.id === data.agentId) {
          const logs = current.logs || [];
          return {
            ...current,
            logs: [...logs, `[${new Date().toLocaleTimeString()}] ${data.log}`],
          };
        }
        return current;
      });
    });

    setSocket(s);

    return () => s.disconnect();
  }, []);

  // Trigger 12BOT Task via Socket.io
  const handleGenerate = () => {
    if (!socket || isProcessing) return;

    setIsProcessing(true);
    const targetAgentId = selectedAgent ? selectedAgent.id : 'agent_1';

    socket.emit('run_bot_task', {
      agentId: targetAgentId,
      prompt: `[${selectedNiche}] ${prompt}`,
    });
  };

  // Top-Up Tokens Route Trigger
  const handleRecharge = async () => {
    try {
      const res = await fetch(`${SOCKET_SERVER_URL}/api/recharge`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setTokensRemaining(data.tokensRemaining);
      }
    } catch (e) {
      if (socket) {
        socket.emit('recharge_tokens');
      }
    }
  };

  const isTokenWarning = tokensRemaining < 100;

  return (
    <div className={`orchestra-app-container ${isDayMode ? 'day-mode' : 'night-mode'}`}>
      {/* ── 1. HEADER NAVIGATION BAR ────────────────────────────────────── */}
      <header className="app-top-header">
        <div className="header-left">
          <div className="retro-logo-icon">(†!†)</div>
          <h1 className="retro-title">
            Orchestra2D <span>12BOT Generator Interface</span>
          </h1>
        </div>

        <div className="header-right">
          {/* Token Budget Meter with Warning */}
          <div className={`token-meter-badge ${isTokenWarning ? 'warning' : 'normal'}`}>
            <span>Tokens:</span>
            <strong>{tokensRemaining}</strong>
          </div>

          {/* Recharge Action Button */}
          <button className="recharge-btn" onClick={handleRecharge}>
            ⚡ Recharge (+500)
          </button>

          {/* Day / Night Mode Toggle */}
          <button className="theme-toggle-btn" onClick={() => setIsDayMode(!isDayMode)}>
            {isDayMode ? '🌙 Night Mode' : '☀️ Day Mode'}
          </button>
        </div>
      </header>

      {/* ── 2. INTERACTIVE PIXEL ART CANVAS VIEWPORT ────────────────────── */}
      <PixelOffice
        agents={agents}
        isDayMode={isDayMode}
        onSelectAgent={(agent) => setSelectedAgent(agent)}
      />

      {/* ── 3. BOTTOM CONTROL PANEL (Generator UI) ──────────────────────── */}
      <footer className="generator-bottom-panel">
        {/* Section 1: Current Project Info */}
        <div className="generator-section info-col">
          <h3>Current Project Info</h3>
          <div className="info-row">
            <span className="info-label">Niche:</span>
            <span className="info-val">[{selectedNiche}]</span>
          </div>
          <div className="info-row">
            <span className="info-label">Project:</span>
            <span className="info-val">[{projectName}]</span>
          </div>
        </div>

        {/* Section 2: Prompt Input Textarea */}
        <div className="generator-section prompt-col">
          <h3>Prompt</h3>
          <textarea
            className="prompt-textarea"
            placeholder="Enter your custom 12BOT instructions here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* Section 3: Niche Selection List */}
        <div className="generator-section niche-col">
          <h3>Niche</h3>
          <div className="niche-picker-list">
            {NICHES.map((niche) => (
              <div
                key={niche}
                className={`niche-option ${selectedNiche === niche ? 'active' : ''}`}
                onClick={() => setSelectedNiche(niche)}
              >
                {niche}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Generate Action Button */}
        <div className="generator-section action-col">
          {isProcessing && <div className="processing-badge-pulse">Processing...</div>}
          <button
            className="generate-action-button"
            onClick={handleGenerate}
            disabled={isProcessing || tokensRemaining <= 0}
          >
            {isProcessing ? 'Executing...' : 'Generate'}
          </button>
        </div>
      </footer>

      {/* ── 4. INTERACTIVE AGENT MODAL DRAWER ───────────────────────────── */}
      {selectedAgent && (
        <div className="agent-modal-backdrop" onClick={() => setSelectedAgent(null)}>
          <div className="agent-modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>{selectedAgent.name}</h2>
              <button className="close-drawer-btn" onClick={() => setSelectedAgent(null)}>
                ✕
              </button>
            </div>

            <div className="agent-profile-card">
              <div className="profile-field">
                <span className="field-key">Role:</span>
                <span className="field-val" style={{ color: selectedAgent.color }}>
                  {selectedAgent.role}
                </span>
              </div>
              <div className="profile-field">
                <span className="field-key">Status:</span>
                <span className="field-val">{selectedAgent.state}</span>
              </div>
              <div className="profile-field">
                <span className="field-key">Current Message:</span>
                <span className="field-val">{selectedAgent.message || 'Idle'}</span>
              </div>
              <div className="profile-field">
                <span className="field-key">Position:</span>
                <span className="field-val">
                  X: {selectedAgent.currentX}%, Y: {selectedAgent.currentY}%
                </span>
              </div>
            </div>

            <div className="logs-section-title">Live Execution Logs</div>
            <div className="agent-terminal-logs">
              {selectedAgent.logs && selectedAgent.logs.length > 0 ? (
                selectedAgent.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`terminal-log-entry ${log.includes('ERROR') ? 'error' : ''}`}
                  >
                    {log}
                  </div>
                ))
              ) : (
                <div className="terminal-log-entry">No active execution history.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
