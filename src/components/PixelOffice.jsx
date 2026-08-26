import React from 'react';

/**
 * PixelOffice.jsx — Canvas viewport, workstation desks, coffee station,
 * and animated 16-bit agent sprites with socket bindings.
 */
export default function PixelOffice({
  agents = [],
  isDayMode = false,
  onSelectAgent,
}) {
  return (
    <div className={`viewport-canvas ${isDayMode ? 'day' : 'night'}`}>
      {/* Floor Tile Grid */}
      <div className="floor-grid" />

      {/* Coffee Bar Target Station (Top-Right: X: 82%, Y: 15%) */}
      <div className="coffee-station-widget">
        <span className="steam-particle">♨️</span>
        <span>☕ Coffee Bar</span>
      </div>

      {/* Render Workstation Desks with glowing CRT Monitors */}
      {agents.map((agent) => (
        <div
          key={`desk-${agent.id}`}
          className="workstation-desk"
          style={{
            left: `${agent.deskX}%`,
            top: `${agent.deskY}%`,
          }}
        >
          <div className="crt-monitor" />
        </div>
      ))}

      {/* Render Dynamic Animated Agent Sprites */}
      {agents.map((agent) => {
        const stateClass = agent.state?.toLowerCase() || 'idle';

        return (
          <div
            key={agent.id}
            className={`agent-sprite-wrapper ${stateClass}`}
            style={{
              left: `${agent.currentX}%`,
              top: `${agent.currentY}%`,
            }}
            onClick={() => onSelectAgent && onSelectAgent(agent)}
          >
            {/* Live Floating Status Bubbles */}
            {agent.state === 'TYPING' && (
              <div className="floating-status-bubble typing">Coding... 💻</div>
            )}
            {agent.state === 'WALKING' && (
              <div className="floating-status-bubble walking">Walking 🚶</div>
            )}
            {agent.state === 'DRINKING_COFFEE' && (
              <div className="floating-status-bubble drinking_coffee">Sipping Coffee ☕</div>
            )}
            {agent.state === 'OUT_OF_TOKENS' && (
              <div className="floating-status-bubble out_of_tokens">Out of Tokens! 🪫</div>
            )}

            {/* Pixel Character Representation */}
            <div className="pixel-avatar">
              <div className="avatar-head" />
              <div
                className="avatar-body"
                style={{ backgroundColor: agent.color || '#3b82f6' }}
              />
            </div>

            {/* Agent Name Tag */}
            <div className="agent-label-name">{agent.name}</div>
          </div>
        );
      })}
    </div>
  );
}
