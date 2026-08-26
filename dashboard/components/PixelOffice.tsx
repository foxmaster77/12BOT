import React, { useState } from 'react';

export type AgentState = 'TYPING' | 'DRINKING_COFFEE' | 'OUT_OF_TOKENS' | 'WALKING';

export interface PixelAgent {
  id: string;
  name: string;
  role: string;
  color: string;
  state: AgentState;
  deskX: number; // percentage
  deskY: number; // percentage
  currentX: number;
  currentY: number;
}

// 12 Agents arranged in a 3-row x 4-column layout
const INITIAL_AGENTS: PixelAgent[] = [
  // Row 1
  { id: 'pm', name: 'A01 PM', role: 'Project Manager', color: '#38bdf8', state: 'TYPING', deskX: 12, deskY: 25, currentX: 12, currentY: 25 },
  { id: 'idea', name: 'A02 Idea', role: 'Idea Generator', color: '#818cf8', state: 'TYPING', deskX: 28, deskY: 25, currentX: 28, currentY: 25 },
  { id: 'designer', name: 'A03 Design', role: 'UI/UX Designer', color: '#c084fc', state: 'TYPING', deskX: 44, deskY: 25, currentX: 44, currentY: 25 },
  { id: 'html_dev', name: 'A04 HTML', role: 'HTML Dev', color: '#f472b6', state: 'TYPING', deskX: 60, deskY: 25, currentX: 60, currentY: 25 },

  // Row 2
  { id: 'css_dev', name: 'A05 CSS', role: 'CSS Dev', color: '#34d399', state: 'DRINKING_COFFEE', deskX: 12, deskY: 55, currentX: 86, currentY: 18 },
  { id: 'js_dev', name: 'A06 JS', role: 'JS Dev', color: '#fbbf24', state: 'TYPING', deskX: 28, deskY: 55, currentX: 28, currentY: 55 },
  { id: 'animation_dev', name: 'A07 Anim', role: 'Animation Dev', color: '#fb923c', state: 'TYPING', deskX: 44, deskY: 55, currentX: 44, currentY: 55 },
  { id: 'backend_dev', name: 'A08 Back', role: 'Backend Dev', color: '#60a5fa', state: 'OUT_OF_TOKENS', deskX: 60, deskY: 55, currentX: 60, currentY: 55 },

  // Row 3
  { id: 'db_dev', name: 'A09 DB', role: 'Database Dev', color: '#a78bfa', state: 'TYPING', deskX: 12, deskY: 82, currentX: 12, currentY: 82 },
  { id: 'debugger_1', name: 'A10 QA-1', role: 'Frontend QA', color: '#f87171', state: 'TYPING', deskX: 28, deskY: 82, currentX: 28, currentY: 82 },
  { id: 'debugger_2', name: 'A11 QA-2', role: 'System QA', color: '#ec4899', state: 'TYPING', deskX: 44, deskY: 82, currentX: 44, currentY: 82 },
  { id: 'docs_writer', name: 'A12 Docs', role: 'Docs Writer', color: '#2dd4bf', state: 'TYPING', deskX: 60, deskY: 82, currentX: 60, currentY: 82 },
];

export default function PixelOffice() {
  const [agents, setAgents] = useState<PixelAgent[]>(INITIAL_AGENTS);
  const [tokensLeft, setTokensLeft] = useState(120);
  const [apiStatus, setApiStatus] = useState<'IDLE' | 'CALLING' | 'ERROR_NO_TOKENS'>('IDLE');

  // Simulates an API call that consumes tokens and triggers typing
  const triggerApiCall = () => {
    if (tokensLeft <= 0) {
      setApiStatus('ERROR_NO_TOKENS');
      setAgents((prev) =>
        prev.map((a) => (a.state !== 'DRINKING_COFFEE' ? { ...a, state: 'OUT_OF_TOKENS' } : a))
      );
      return;
    }

    setApiStatus('CALLING');
    setTokensLeft((prev) => Math.max(0, prev - 30));

    // Make active agents start typing intensely
    setAgents((prev) =>
      prev.map((a) =>
        a.state !== 'DRINKING_COFFEE' && a.state !== 'WALKING' ? { ...a, state: 'TYPING' } : a
      )
    );

    setTimeout(() => {
      setApiStatus((prev) => (prev === 'CALLING' ? 'IDLE' : prev));
    }, 2800);
  };

  // Move a specific agent to the coffee machine (located around X: 84-90%, Y: 15-28%)
  const sendToCoffeeBreak = (agentId: string) => {
    const slotOffset = (parseInt(agentId.charCodeAt(0).toString(), 10) % 4) * 3;
    const targetX = 82 + (slotOffset % 8);
    const targetY = 16 + (slotOffset * 2);

    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          return { ...agent, state: 'WALKING', currentX: targetX, currentY: targetY };
        }
        return agent;
      })
    );

    // Switch to DRINKING_COFFEE once arrived
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id === agentId) {
            return { ...agent, state: 'DRINKING_COFFEE' };
          }
          return agent;
        })
      );
    }, 2000);
  };

  // Return agent back to their desk
  const returnToDesk = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          return { ...agent, state: 'WALKING', currentX: agent.deskX, currentY: agent.deskY };
        }
        return agent;
      })
    );

    setTimeout(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id === agentId) {
            return { ...agent, state: 'TYPING' };
          }
          return agent;
        })
      );
    }, 2000);
  };

  // Reset tokens & restore all agents to work
  const resetTokens = () => {
    setTokensLeft(150);
    setApiStatus('IDLE');
    setAgents((prev) =>
      prev.map((agent) => ({
        ...agent,
        state: agent.currentX === agent.deskX ? 'TYPING' : agent.state,
      }))
    );
  };

  // Send all agents to coffee break
  const sendAllToCoffee = () => {
    agents.forEach((agent, index) => {
      setTimeout(() => {
        sendToCoffeeBreak(agent.id);
      }, index * 120);
    });
  };

  // Return all agents back to desks
  const returnAllToDesks = () => {
    agents.forEach((agent, index) => {
      setTimeout(() => {
        returnToDesk(agent.id);
      }, index * 120);
    });
  };

  return (
    <div className="pixel-office-container">
      {/* Top Status Bar & Simulation Controls */}
      <div className="pixel-office-header">
        <div className="pixel-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>API Status:</span>
            <span className={`status-badge ${apiStatus.toLowerCase()}`}>{apiStatus}</span>
          </div>

          <div className="token-counter">
            Tokens Left: <strong>{tokensLeft}</strong>
          </div>
        </div>

        <div className="pixel-controls">
          <button onClick={triggerApiCall} className="action-btn" disabled={apiStatus === 'CALLING'}>
            {apiStatus === 'CALLING' ? '⏳ Calling API...' : '⚡ Run API Call (-30)'}
          </button>
          <button onClick={resetTokens} className="action-btn secondary">
            🔋 Refill Tokens
          </button>
          <button onClick={sendAllToCoffee} className="action-btn coffee-all">
            ☕ All to Coffee
          </button>
          <button onClick={returnAllToDesks} className="action-btn secondary">
            💻 All to Desk
          </button>
        </div>
      </div>

      {/* Main Pixel Art Canvas Viewport */}
      <div className="pixel-viewport">
        {/* Subtle Grid Floor */}
        <div className="pixel-floor-grid" />

        {/* Coffee Station Target Area */}
        <div className="coffee-station-area">
          <span className="steam">♨️</span>
          <span>☕ Coffee Bar</span>
        </div>

        {/* Render Desks for each Agent */}
        {agents.map((agent) => (
          <div
            key={`desk-${agent.id}`}
            className="desk-station"
            style={{
              left: `${agent.deskX}%`,
              top: `${agent.deskY}%`,
            }}
          >
            <div className="monitor" />
          </div>
        ))}

        {/* Render Dynamic 16-Bit Pixel Agents */}
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`pixel-agent-wrapper ${agent.state.toLowerCase()}`}
            style={{
              left: `${agent.currentX}%`,
              top: `${agent.currentY}%`,
            }}
          >
            {/* Dynamic Status Badges */}
            {agent.state === 'OUT_OF_TOKENS' && (
              <div className="status-bubble out-of-tokens">Out of Tokens! 🪫</div>
            )}
            {agent.state === 'DRINKING_COFFEE' && (
              <div className="status-bubble coffee">Sipping Coffee ☕</div>
            )}
            {agent.state === 'TYPING' && (
              <div className="status-bubble typing">Coding... 💻</div>
            )}
            {agent.state === 'WALKING' && (
              <div className="status-bubble walking">Walking 🚶</div>
            )}

            {/* Pixel Character Construction */}
            <div className="agent-avatar">
              <div className="head" />
              <div className="body" style={{ background: agent.color }} />
            </div>

            <div className="agent-name">{agent.name}</div>

            {/* Per-Agent Interactive Action Controls */}
            <div className="agent-actions">
              {agent.state !== 'DRINKING_COFFEE' && agent.state !== 'WALKING' ? (
                <button onClick={() => sendToCoffeeBreak(agent.id)}>Coffee</button>
              ) : agent.state === 'DRINKING_COFFEE' ? (
                <button onClick={() => returnToDesk(agent.id)}>Desk</button>
              ) : (
                <button disabled>...</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
