import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

export type AgentStatus =
  | 'idle'
  | 'working'
  | 'debugging'
  | 'token_swap'
  | 'token'
  | 'on_break'
  | 'cooldown'
  | 'blocked'
  | 'done';

export interface OfficeCanvasProps {
  wsUrl?: string;
  onAgentSelect?: (agentId: string) => void;
}

interface AgentDef {
  id: string;
  code: string;
  name: string;
  colIndex: number;
  gridRow: number;
  gridCol: number;
}

const AGENTS: AgentDef[] = [
  // Row 0
  { id: 'pm', code: 'A01-PM', name: 'PM / Brain', colIndex: 0, gridRow: 0, gridCol: 0 },
  { id: 'idea', code: 'A02-IDEA', name: 'Idea Gen', colIndex: 1, gridRow: 0, gridCol: 1 },
  { id: 'designer', code: 'A03-DESIGNER', name: 'UI/UX Designer', colIndex: 2, gridRow: 0, gridCol: 2 },
  { id: 'html_dev', code: 'A04-HTML', name: 'HTML Dev', colIndex: 3, gridRow: 0, gridCol: 3 },

  // Row 1
  { id: 'css_dev', code: 'A05-CSS', name: 'CSS Dev', colIndex: 4, gridRow: 1, gridCol: 0 },
  { id: 'js_dev', code: 'A06-JS', name: 'JS Dev', colIndex: 5, gridRow: 1, gridCol: 1 },
  { id: 'animation_dev', code: 'A07-ANIM', name: 'Animation Dev', colIndex: 6, gridRow: 1, gridCol: 2 },
  { id: 'backend_dev', code: 'A08-BACKEND', name: 'Backend Dev', colIndex: 7, gridRow: 1, gridCol: 3 },

  // Row 2
  { id: 'db_dev', code: 'A09-DB', name: 'Database Setup', colIndex: 8, gridRow: 2, gridCol: 0 },
  { id: 'debugger_1', code: 'A10-BUGGER1', name: 'Frontend QA', colIndex: 9, gridRow: 2, gridCol: 1 },
  { id: 'debugger_2', code: 'A11-BUGGER2', name: 'System QA', colIndex: 10, gridRow: 2, gridCol: 2 },
  { id: 'docs_writer', code: 'A12-DOCS', name: 'Docs Writer', colIndex: 11, gridRow: 2, gridCol: 3 },
];

interface AgentTextures {
  idle: PIXI.Texture;
  working: PIXI.Texture;
  tokenSwap: PIXI.Texture;
  walking: PIXI.Texture;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 660;

export default function OfficeCanvas({
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001',
  onAgentSelect,
}: OfficeCanvasProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // React state for HTML Overlay Badges
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>(() => {
    const initial: Record<string, AgentStatus> = {};
    AGENTS.forEach((a) => (initial[a.id] = 'idle'));
    return initial;
  });

  const updateAgentStateRef = useRef<((id: string, status: AgentStatus) => void) | null>(null);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    let isDestroyed = false;
    let ws: WebSocket | null = null;

    // 1. Crisp Pixel Art Rendering Configuration
    if (PIXI.settings) {
      PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
      PIXI.settings.ROUND_PIXELS = true;
    }

    // 2. Initialize PixiJS Application
    const app = new PIXI.Application({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: 0x090e1a,
      antialias: false,
      resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      autoDensity: true,
    });

    const canvasElement = (app.view || (app as any).canvas) as HTMLCanvasElement;
    if (canvasElement && canvasContainerRef.current) {
      canvasElement.style.width = '100%';
      canvasElement.style.height = '100%';
      canvasElement.style.display = 'block';
      canvasElement.style.borderRadius = '12px';
      canvasContainerRef.current.appendChild(canvasElement);
    }

    // 3. Layer Architecture
    const floorLayer = new PIXI.Container();
    const deskLayer = new PIXI.Container();
    const characterLayer = new PIXI.Container();

    app.stage.addChild(floorLayer);
    app.stage.addChild(deskLayer);
    app.stage.addChild(characterLayer);

    // 4. Strict 3-Row x 4-Column Grid Dimensions
    const cellWidth = app.screen.width / 4;   // 250px
    const cellHeight = app.screen.height / 3; // 220px

    // Draw Floor Grid & Subtle Tiles
    const floorGfx = new PIXI.Graphics();
    floorGfx.beginFill(0x0f172a);
    floorGfx.drawRoundedRect(12, 12, CANVAS_WIDTH - 24, CANVAS_HEIGHT - 24, 16);
    floorGfx.endFill();

    floorGfx.lineStyle(1, 0x1e293b, 0.3);
    for (let c = 1; c < 4; c++) {
      floorGfx.moveTo(c * cellWidth, 16);
      floorGfx.lineTo(c * cellWidth, CANVAS_HEIGHT - 16);
    }
    for (let r = 1; r < 3; r++) {
      floorGfx.moveTo(16, r * cellHeight);
      floorGfx.lineTo(CANVAS_WIDTH - 16, r * cellHeight);
    }
    floorLayer.addChild(floorGfx);

    // Desk & Sprite References
    interface AgentNode {
      def: AgentDef;
      sprite: PIXI.Sprite;
      glowRing: PIXI.Graphics;
      textures: AgentTextures | null;
      status: AgentStatus;
      baseX: number;
      baseY: number;
    }

    const agentNodes = new Map<string, AgentNode>();

    // 5. Render Desks and Agent Sprites strictly centered in cells
    AGENTS.forEach((agent) => {
      const centerX = agent.gridCol * cellWidth + cellWidth / 2;
      const centerY = agent.gridRow * cellHeight + cellHeight / 2 + 10;

      // Desk Graphic
      const deskGfx = new PIXI.Graphics();
      // Floor Shadow
      deskGfx.beginFill(0x000000, 0.4);
      deskGfx.drawEllipse(centerX, centerY + 28, 44, 10);
      deskGfx.endFill();

      // Desk Tabletop
      deskGfx.beginFill(0x1e293b);
      deskGfx.lineStyle(1.5, 0x334155);
      deskGfx.drawRoundedRect(centerX - 42, centerY + 4, 84, 28, 6);
      deskGfx.endFill();

      // Computer Monitor
      deskGfx.beginFill(0x0b1329);
      deskGfx.lineStyle(1, 0x38bdf8, 0.7);
      deskGfx.drawRoundedRect(centerX - 18, centerY + 8, 36, 18, 3);
      deskGfx.endFill();

      deskLayer.addChild(deskGfx);

      // Pulsing Glow Ring (for token swap)
      const glowRing = new PIXI.Graphics();
      glowRing.lineStyle(2.5, 0xeab308, 0.9);
      glowRing.drawRoundedRect(centerX - 48, centerY - 32, 96, 74, 12);
      glowRing.visible = false;
      deskLayer.addChild(glowRing);

      // Character Sprite
      const sprite = new PIXI.Sprite();
      sprite.anchor.set(0.5, 0.65);
      sprite.x = centerX;
      sprite.y = centerY;
      sprite.scale.set(1.25); // Sane 1.25x scaling for crisp pixel art
      characterLayer.addChild(sprite);

      agentNodes.set(agent.id, {
        def: agent,
        sprite,
        glowRing,
        textures: null,
        status: 'idle',
        baseX: centerX,
        baseY: centerY,
      });
    });

    // 6. EXACT Texture Slicing Math (12 Columns x 4 Rows)
    const loadSpritesheet = () => {
      const baseTexture = PIXI.BaseTexture.from('/assets/agents-spritesheet.png');

      const applySlicing = () => {
        if (!baseTexture || baseTexture.width <= 0 || isDestroyed) return;

        baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

        const frameWidth = baseTexture.width / 12;
        const frameHeight = baseTexture.height / 4;

        function getFrame(col: number, row: number) {
          return new PIXI.Texture(
            baseTexture,
            new PIXI.Rectangle(col * frameWidth, row * frameHeight, frameWidth, frameHeight)
          );
        }

        AGENTS.forEach((agent) => {
          const col = agent.colIndex;
          const textures: AgentTextures = {
            idle: getFrame(col, 0),      // Row 0: Idle
            working: getFrame(col, 1),   // Row 1: Working (typing)
            tokenSwap: getFrame(col, 2), // Row 2: Token Swap
            walking: getFrame(col, 3),   // Row 3: Walking
          };

          const node = agentNodes.get(agent.id);
          if (node) {
            node.textures = textures;
            node.sprite.texture = textures.idle;
            // Maintain crisp 1.25x pixel art scale
            node.sprite.scale.set(1.25);
            updateAgentVisual(node, node.status);
          }
        });
      };

      if (baseTexture.valid) {
        applySlicing();
      } else {
        baseTexture.on('loaded', applySlicing);
      }
    };

    loadSpritesheet();

    // 7. Visual State Switcher
    const updateAgentVisual = (node: AgentNode, status: AgentStatus) => {
      node.status = status;
      if (!node.textures) return;

      switch (status) {
        case 'working':
        case 'debugging':
          node.sprite.visible = true;
          node.sprite.texture = node.textures.working;
          node.glowRing.visible = false;
          break;

        case 'token_swap':
        case 'token':
          node.sprite.visible = true;
          node.sprite.texture = node.textures.tokenSwap;
          node.glowRing.visible = true;
          break;

        case 'on_break':
        case 'cooldown':
          node.sprite.visible = true;
          node.sprite.texture = node.textures.walking;
          node.glowRing.visible = false;
          break;

        case 'idle':
        case 'done':
        case 'blocked':
        default:
          node.sprite.visible = true;
          node.sprite.texture = node.textures.idle;
          node.glowRing.visible = false;
          break;
      }
    };

    // Callback to update both Pixi & React state
    updateAgentStateRef.current = (agentId: string, status: AgentStatus) => {
      const node = agentNodes.get(agentId);
      if (node) {
        updateAgentVisual(node, status);
      }
      setAgentStatuses((prev) => ({ ...prev, [agentId]: status }));
    };

    // 8. Master Animation Ticker (Sine Bounce & Ring Pulse)
    let tickerTime = 0;
    app.ticker.add((delta) => {
      tickerTime += delta * 0.05;

      agentNodes.forEach((node) => {
        // Subtle Sine Bounce on Working
        if (node.status === 'working' || node.status === 'debugging') {
          node.sprite.y = node.baseY + Math.sin(tickerTime * 8 + node.def.colIndex) * 1.5;
        } else {
          node.sprite.y = node.baseY;
        }

        // Pulsing Golden Ring on Token Swap
        if (node.glowRing.visible) {
          const pulse = (Math.sin(tickerTime * 10) + 1) / 2;
          node.glowRing.alpha = 0.45 + pulse * 0.55;
        }
      });
    });

    // 9. WebSocket Synchronizer
    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isDestroyed) return;
          setConnectionStatus('connected');
        };

        ws.onmessage = (event) => {
          if (isDestroyed) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'initial_state' && Array.isArray(data.agents)) {
              data.agents.forEach((ag: any) => {
                const id = ag.agentId || ag.id;
                const status = ag.status as AgentStatus;
                if (id && status && updateAgentStateRef.current) {
                  updateAgentStateRef.current(id, status);
                }
              });
            }

            const agentId = data.agent_id || data.agentId;
            const status = data.status as AgentStatus;
            if (agentId && status && updateAgentStateRef.current) {
              updateAgentStateRef.current(agentId, status);
            }
          } catch (e) {
            console.error('[OfficeCanvas] WS parse error:', e);
          }
        };

        ws.onclose = () => {
          if (isDestroyed) return;
          setConnectionStatus('disconnected');
          setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          if (isDestroyed) return;
          setConnectionStatus('disconnected');
        };
      } catch (err) {
        setConnectionStatus('disconnected');
      }
    };

    connectWs();

    // 10. Cleanup on Unmount
    return () => {
      isDestroyed = true;
      if (ws) {
        ws.close();
        ws = null;
      }
      try {
        app.destroy(true, { children: true, texture: false, baseTexture: false });
      } catch (e) {
        console.warn('[OfficeCanvas] Cleanup warning:', e);
      }
    };
  }, [wsUrl]);

  // Helper for Status Badge Colors & Labels
  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'working':
      case 'debugging':
        return { dotColor: '#22c55e', text: status === 'debugging' ? 'DEBUGGING' : 'WORKING', textColor: '#86efac' };
      case 'token_swap':
      case 'token':
        return { dotColor: '#eab308', text: 'TOKEN', textColor: '#fde047' };
      case 'on_break':
      case 'cooldown':
        return { dotColor: '#ef4444', text: 'ON BREAK', textColor: '#fca5a5' };
      case 'done':
        return { dotColor: '#06b6d4', text: 'DONE', textColor: '#67e8f9' };
      case 'blocked':
        return { dotColor: '#dc2626', text: 'BLOCKED', textColor: '#fca5a5' };
      case 'idle':
      default:
        return { dotColor: '#64748b', text: 'IDLE', textColor: '#94a3b8' };
    }
  };

  return (
    <div
      style={{
        position: 'relative', // Relative parent container for absolute HTML badges
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      {/* Top Floating Telemetry Status Bar */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '20px',
          zIndex: 30,
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(51, 65, 85, 0.8)',
          fontSize: '12px',
          color: '#f8fafc',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                connectionStatus === 'connected'
                  ? '#22c55e'
                  : connectionStatus === 'connecting'
                  ? '#eab308'
                  : '#ef4444',
              boxShadow: connectionStatus === 'connected' ? '0 0 8px #22c55e' : 'none',
            }}
          />
          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{connectionStatus}</span>
        </div>
      </div>

      {/* HTML Overlay Badges mapped to (x, y) grid coordinates with z-index: 20 */}
      {AGENTS.map((agent) => {
        const status = agentStatuses[agent.id] || 'idle';
        const badge = getStatusBadge(status);

        // Grid cell percentage center coordinates
        const leftPercent = ((agent.gridCol * 2 + 1) / 8) * 100;
        const topPercent = ((agent.gridRow * 2 + 1) / 6) * 100;

        return (
          <div
            key={agent.id}
            onClick={() => onAgentSelect && onAgentSelect(agent.id)}
            style={{
              position: 'absolute',
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              transform: 'translate(-50%, -58px)', // Positioned -58px above sprite center (no clipping)
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                background: 'rgba(11, 19, 41, 0.94)',
                border: '1px solid rgba(30, 41, 59, 0.9)',
                borderRadius: '8px',
                padding: '3px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
                minWidth: '78px',
              }}
            >
              {/* Agent ID Label */}
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  letterSpacing: '0.6px',
                  lineHeight: '12px',
                }}
              >
                {agent.code}
              </span>

              {/* Status Pill with Glowing Dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: badge.dotColor,
                    boxShadow: status === 'working' ? '0 0 6px #22c55e' : status === 'token_swap' ? '0 0 6px #eab308' : 'none',
                  }}
                />
                <span
                  style={{
                    fontSize: '8px',
                    fontWeight: 700,
                    color: badge.textColor,
                    letterSpacing: '0.4px',
                    lineHeight: '10px',
                  }}
                >
                  {badge.text}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* PixiJS Canvas Mounting Container */}
      <div
        ref={canvasContainerRef}
        style={{
          width: '100%',
          aspectRatio: '1000 / 660',
          background: '#090e1a',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        }}
      />
    </div>
  );
}
