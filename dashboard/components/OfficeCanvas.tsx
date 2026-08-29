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
  onReady?: (dispatch: (id: string, status: AgentStatus) => void) => void;
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
  { id: 'pm',           code: 'A01-PM',      name: 'PM / Brain',     colIndex: 0,  gridRow: 0, gridCol: 0 },
  { id: 'idea',         code: 'A02-IDEA',    name: 'Idea Gen',       colIndex: 1,  gridRow: 0, gridCol: 1 },
  { id: 'designer',     code: 'A03-DESIGN',  name: 'UI/UX Designer', colIndex: 2,  gridRow: 0, gridCol: 2 },
  { id: 'html_dev',     code: 'A04-HTML',    name: 'HTML Dev',       colIndex: 3,  gridRow: 0, gridCol: 3 },
  { id: 'css_dev',      code: 'A05-CSS',     name: 'CSS Dev',        colIndex: 4,  gridRow: 1, gridCol: 0 },
  { id: 'js_dev',       code: 'A06-JS',      name: 'JS Dev',         colIndex: 5,  gridRow: 1, gridCol: 1 },
  { id: 'animation_dev',code: 'A07-ANIM',    name: 'Animation Dev',  colIndex: 6,  gridRow: 1, gridCol: 2 },
  { id: 'backend_dev',  code: 'A08-BACKEND', name: 'Backend Dev',    colIndex: 7,  gridRow: 1, gridCol: 3 },
  { id: 'db_dev',       code: 'A09-DB',      name: 'Database Setup', colIndex: 8,  gridRow: 2, gridCol: 0 },
  { id: 'debugger_1',   code: 'A10-QA1',     name: 'Frontend QA',    colIndex: 9,  gridRow: 2, gridCol: 1 },
  { id: 'debugger_2',   code: 'A11-QA2',     name: 'System QA',      colIndex: 10, gridRow: 2, gridCol: 2 },
  { id: 'docs_writer',  code: 'A12-DOCS',    name: 'Docs Writer',    colIndex: 11, gridRow: 2, gridCol: 3 },
];

interface AgentTextures {
  idle: PIXI.Texture;
  working: PIXI.Texture;
  tokenSwap: PIXI.Texture;
  walking: PIXI.Texture;
}

// ─── GAME ENGINE CONSTANTS ────────────────────────────────────────────────────
const CANVAS_WIDTH  = 1000;
const CANVAS_HEIGHT = 660;

// 8fps = 125ms per frame. At 60fps ticker that's 60/8 ≈ 7.5 ticks per frame.
const TICKS_PER_ANIM_FRAME = 7;   // advance walk/type frame every 7 ticker ticks

// Walk speed: pixels per ticker tick (constant velocity, ZERO easing)
const WALK_SPEED_PX = 1.6;

// Coffee station target position (top-right area)
const COFFEE_STATION_X = CANVAS_WIDTH  - 80;
const COFFEE_STATION_Y = 90;

// ─── AGENT RUNTIME STATE ─────────────────────────────────────────────────────
interface AgentNode {
  def: AgentDef;
  sprite: PIXI.Sprite;
  glowRing: PIXI.Graphics;
  textures: AgentTextures | null;
  status: AgentStatus;

  // Pixel-exact base (home desk) position — always integer
  baseX: number;
  baseY: number;

  // Current rendered position — floats only during movement, snapped on render
  currentX: number;
  currentY: number;

  // Walk target — integer destination
  targetX: number;
  targetY: number;

  isWalking: boolean;

  // Frame-step counters (ticker-driven, NOT CSS)
  animTickCounter: number;   // ticks since last frame advance
  walkFrameIndex: number;    // 0 = idle-stand, 1 = step-A (foot up), 2 = step-B (other foot)

  // Idle breathing state
  idleBreathTick: number;    // monotonically increasing tick for slow sine

  // Scale pulse for task-complete reaction (frame-counted)
  pulseTick: number;         // -1 = inactive, 0-5 = pulse animation frames
  pulseScale: number;

  // Status icon pop state: 0 = off, 1 = blink frame 1, 2 = blink frame 2, 3 = stable on
  iconPopFrame: number;
  showIcon: boolean;
  iconText: string;
}

export default function OfficeCanvas({
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001',
  onAgentSelect,
  onReady,
}: OfficeCanvasProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // React state for HTML badges — updated only on status transitions, not every frame
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>(() => {
    const init: Record<string, AgentStatus> = {};
    AGENTS.forEach((a) => (init[a.id] = 'idle'));
    return init;
  });

  const updateAgentStateRef = useRef<((id: string, status: AgentStatus) => void) | null>(null);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    let isDestroyed = false;
    let ws: WebSocket | null = null;

    // ── FIX 1: Pixel-perfect rendering — set BEFORE any texture loads ─────────
    if (PIXI.settings) {
      (PIXI.settings as any).SCALE_MODE  = PIXI.SCALE_MODES.NEAREST; // nearest-neighbor — no blur
      (PIXI.settings as any).ROUND_PIXELS = true;                     // engine-level integer snapping
    }

    const app = new PIXI.Application({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: 0x090e1a,
      antialias: false,             // no anti-aliasing — crisp pixel edges
      resolution: 1,                // integer 1x — never fractional
      autoDensity: false,
    });

    const canvasEl = (app.view || (app as any).canvas) as HTMLCanvasElement;
    if (canvasEl && canvasContainerRef.current) {
      // CSS pixel rendering — must be pixelated, not smooth
      canvasEl.style.imageRendering = 'pixelated';
      canvasEl.style.width  = '100%';
      canvasEl.style.height = '100%';
      canvasEl.style.display = 'block';
      canvasEl.style.borderRadius = '12px';
      // Explicitly override any UA smoothing
      (canvasEl.style as any).msInterpolationMode = 'nearest-neighbor';
      canvasContainerRef.current.appendChild(canvasEl);
    }

    // ── Layers ────────────────────────────────────────────────────────────────
    const floorLayer = new PIXI.Container();
    const deskLayer  = new PIXI.Container();
    const charLayer  = new PIXI.Container();
    app.stage.addChild(floorLayer, deskLayer, charLayer);

    // ── Integer grid dimensions (snapped) ─────────────────────────────────────
    const cellW = Math.round(CANVAS_WIDTH  / 4);  // 250
    const cellH = Math.round(CANVAS_HEIGHT / 3);  // 220

    // Draw pixel-grid floor
    const floorGfx = new PIXI.Graphics();
    floorGfx.beginFill(0x0f172a);
    floorGfx.drawRoundedRect(12, 12, CANVAS_WIDTH - 24, CANVAS_HEIGHT - 24, 16);
    floorGfx.endFill();
    floorGfx.lineStyle(1, 0x1e293b, 0.25);
    for (let c = 1; c < 4; c++) {
      floorGfx.moveTo(c * cellW, 16);
      floorGfx.lineTo(c * cellW, CANVAS_HEIGHT - 16);
    }
    for (let r = 1; r < 3; r++) {
      floorGfx.moveTo(16, r * cellH);
      floorGfx.lineTo(CANVAS_WIDTH - 16, r * cellH);
    }
    floorLayer.addChild(floorGfx);

    // ── Desks & Agent nodes ────────────────────────────────────────────────────
    const agentNodes = new Map<string, AgentNode>();

    AGENTS.forEach((agent) => {
      // Always snap desk position to integer pixel grid
      const bx = Math.round(agent.gridCol * cellW + cellW / 2);
      const by = Math.round(agent.gridRow * cellH + cellH / 2 + 10);

      // Desk graphic
      const deskGfx = new PIXI.Graphics();
      deskGfx.beginFill(0x000000, 0.35);
      deskGfx.drawEllipse(bx, by + 28, 44, 10);
      deskGfx.endFill();
      deskGfx.beginFill(0x1e293b);
      deskGfx.lineStyle(1, 0x334155);
      deskGfx.drawRoundedRect(bx - 42, by + 4, 84, 28, 6);
      deskGfx.endFill();
      deskGfx.beginFill(0x0b1329);
      deskGfx.lineStyle(1, 0x38bdf8, 0.65);
      deskGfx.drawRoundedRect(bx - 18, by + 8, 36, 18, 3);
      deskGfx.endFill();
      deskLayer.addChild(deskGfx);

      const glowRing = new PIXI.Graphics();
      glowRing.lineStyle(2.5, 0xeab308, 0.9);
      glowRing.drawRoundedRect(bx - 48, by - 32, 96, 74, 12);
      glowRing.visible = false;
      deskLayer.addChild(glowRing);

      const sprite = new PIXI.Sprite();
      sprite.anchor.set(0.5, 0.65);
      // ── FIX 1: Integer-only position — Math.round applied here ──
      sprite.x = bx;
      sprite.y = by;
      // ── FIX 1: Integer scale only (2x) ──
      sprite.scale.set(2);
      charLayer.addChild(sprite);

      agentNodes.set(agent.id, {
        def: agent,
        sprite,
        glowRing,
        textures: null,
        status: 'idle',
        baseX: bx,
        baseY: by,
        currentX: bx,
        currentY: by,
        targetX: bx,
        targetY: by,
        isWalking: false,
        animTickCounter: 0,
        walkFrameIndex: 0,
        idleBreathTick: agent.colIndex * 14, // stagger per agent so they don't all bob in sync
        pulseTick: -1,
        pulseScale: 2,
        iconPopFrame: 0,
        showIcon: false,
        iconText: '',
      });
    });

    // ── Spritesheet (nearest-neighbor set BEFORE loading) ─────────────────────
    const loadSpritesheet = () => {
      const baseTex = PIXI.BaseTexture.from('/assets/agents-spritesheet.png');
      baseTex.scaleMode = PIXI.SCALE_MODES.NEAREST; // Must be set before valid

      const slice = () => {
        if (!baseTex || baseTex.width <= 0 || isDestroyed) return;
        const fw = baseTex.width  / 12;
        const fh = baseTex.height / 4;

        const getFrame = (col: number, row: number) =>
          new PIXI.Texture(baseTex, new PIXI.Rectangle(col * fw, row * fh, fw, fh));

        AGENTS.forEach((agent) => {
          const col = agent.colIndex;
          const tex: AgentTextures = {
            idle:      getFrame(col, 0),
            working:   getFrame(col, 1),
            tokenSwap: getFrame(col, 2),
            walking:   getFrame(col, 3),
          };
          const node = agentNodes.get(agent.id);
          if (node) {
            node.textures = tex;
            node.sprite.texture = tex.idle;
            node.sprite.scale.set(2); // enforce integer scale after texture load
          }
        });
      };

      if (baseTex.valid) slice();
      else baseTex.on('loaded', slice);
    };

    loadSpritesheet();

    // ── State transition helper — drives walk, icon pop, pulse ────────────────
    const setAgentStatus = (node: AgentNode, status: AgentStatus) => {
      const prev = node.status;
      node.status = status;

      // ── FIX 4: Instant icon pop-in on state change, frame-counted ──
      if (prev !== status) {
        node.iconPopFrame = 1;  // Start 2-frame blink pop sequence in ticker
        node.showIcon = false;

        // Determine icon text for new state
        switch (status) {
          case 'working':    node.iconText = '💻'; break;
          case 'debugging':  node.iconText = '🔍'; break;
          case 'token_swap':
          case 'token':      node.iconText = '⚡'; break;
          case 'on_break':
          case 'cooldown':   node.iconText = '☕'; break;
          case 'done':       node.iconText = '✓';  break;
          case 'blocked':    node.iconText = '⛔'; break;
          default:           node.iconText = '';   break;
        }
      }

      // ── FIX 4: Task-complete sharp scale pulse ──
      if (status === 'done' && prev !== 'done') {
        node.pulseTick = 0;
      }

      // ── Decide walk target ──
      if ((status === 'on_break' || status === 'cooldown') && !node.isWalking) {
        node.targetX = Math.round(COFFEE_STATION_X);
        node.targetY = Math.round(COFFEE_STATION_Y + node.def.colIndex * 3);
        node.isWalking = true;
      } else if ((status === 'idle' || status === 'done') && node.isWalking) {
        // Walk back to desk
        node.targetX = node.baseX;
        node.targetY = node.baseY;
        node.isWalking = true;
      } else if (status !== 'on_break' && status !== 'cooldown') {
        // Snap back to desk if not walking
        node.targetX = node.baseX;
        node.targetY = node.baseY;
      }

      // Glow ring
      node.glowRing.visible = (status === 'token_swap' || status === 'token');
    };

    // Public callback
    updateAgentStateRef.current = (agentId: string, status: AgentStatus) => {
      const node = agentNodes.get(agentId);
      if (node) setAgentStatus(node, status);
      setAgentStatuses((prev) => ({ ...prev, [agentId]: status }));
    };

    if (onReady && updateAgentStateRef.current) {
      onReady(updateAgentStateRef.current);
    }

    // ── MASTER TICKER — SINGLE SOURCE OF TRUTH FOR ALL MOTION ────────────────
    //
    // Everything below is frame-counted, integer-snapped, zero-CSS.
    // No CSS transition, animation, or easing curve touches any agent.
    //
    let masterTick = 0;

    app.ticker.add(() => {
      masterTick++;

      agentNodes.forEach((node) => {
        const { sprite } = node;
        if (!node.textures) return;

        // ── FIX 2 & 3: Walk movement — linear constant velocity, ZERO easing ──
        if (node.currentX !== node.targetX || node.currentY !== node.targetY) {
          const dx = node.targetX - node.currentX;
          const dy = node.targetY - node.currentY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= WALK_SPEED_PX) {
            // Arrived — snap exactly to integer target
            node.currentX = node.targetX;
            node.currentY = node.targetY;
            node.isWalking = false;
          } else {
            // ── FIX 3: Constant velocity — no easing, no curve ──
            node.currentX += (dx / dist) * WALK_SPEED_PX;
            node.currentY += (dy / dist) * WALK_SPEED_PX;
          }
        }

        // ── FIX 2: Frame-stepped walk cycle at exactly 8fps ──
        node.animTickCounter++;
        if (node.animTickCounter >= TICKS_PER_ANIM_FRAME) {
          node.animTickCounter = 0;
          // Advance 4-frame cycle: 0=stand, 1=stepA, 2=stand, 3=stepB
          node.walkFrameIndex = (node.walkFrameIndex + 1) % 4;
        }

        // ── FIX 5: Idle breathing — 1px sine bob, 2s period, pixel-rounded ──
        node.idleBreathTick++;
        const breathPeriodTicks = 120; // ~2s at 60fps
        const breathY = Math.round(Math.sin((node.idleBreathTick / breathPeriodTicks) * Math.PI * 2));
        // breathY is -1, 0, or 1 — always an integer

        // ── FIX 2: Walk-cycle Y offset — 2-frame fake step bob ──
        let walkBobY = 0;
        let stepTexture = node.textures.idle;

        const isMoving = (node.currentX !== node.targetX || node.currentY !== node.targetY) || node.isWalking;

        if (isMoving) {
          // Frame 1 & 3: step frames shift sprite up by 1px (discrete step, not smooth)
          walkBobY = (node.walkFrameIndex === 1 || node.walkFrameIndex === 3) ? -1 : 0;
          stepTexture = node.textures.walking;
        } else {
          // Static texture based on status
          switch (node.status) {
            case 'working':
            case 'debugging':
              stepTexture = node.textures.working;
              // Typing: alternate between idle and working frames for "tap" feel
              stepTexture = (node.walkFrameIndex < 2) ? node.textures.working : node.textures.idle;
              break;
            case 'token_swap':
            case 'token':
              stepTexture = node.textures.tokenSwap;
              break;
            default:
              stepTexture = node.textures.idle;
              break;
          }
        }

        // Apply texture (instant swap — no fade, no transition)
        if (sprite.texture !== stepTexture) {
          sprite.texture = stepTexture;
        }

        // ── FIX 4: Scale pulse — frame-counted, NOT CSS transition ──
        if (node.pulseTick >= 0) {
          node.pulseTick++;
          // 6 frames total at 8fps = ~750ms. Shape: grow 3fr, shrink 3fr
          if (node.pulseTick <= 3) {
            // Scale up: 2.0 → 2.3 over 3 frames (discrete steps)
            node.pulseScale = 2.0 + (node.pulseTick / 3) * 0.3;
          } else if (node.pulseTick <= 6) {
            // Scale back: 2.3 → 2.0
            node.pulseScale = 2.3 - ((node.pulseTick - 3) / 3) * 0.3;
          } else {
            node.pulseScale = 2.0;
            node.pulseTick = -1; // Done
          }
          sprite.scale.set(node.pulseScale);
        } else {
          sprite.scale.set(2); // Integer 2x always
        }

        // ── FIX 4: Icon pop-in — 2-frame blink sequence ──
        if (node.iconPopFrame > 0) {
          if (node.animTickCounter === 0) { // advance on frame boundary
            node.iconPopFrame++;
            if (node.iconPopFrame === 2) node.showIcon = true;   // blink on
            if (node.iconPopFrame === 3) node.showIcon = false;  // blink off
            if (node.iconPopFrame >= 4) {
              node.showIcon = node.iconText !== '';               // stable
              node.iconPopFrame = 0;
            }
          }
        }

        // ── FIX 1 + 2 + 5: Final position — Math.round EVERY frame ──
        // Sub-pixel positions are forbidden — this is the single place they get floored.
        const finalX = Math.round(node.currentX);
        const finalY = Math.round(node.currentY) + walkBobY + breathY;

        sprite.x = finalX;
        sprite.y = finalY;

        // Glow ring pulse (also ticker-driven)
        if (node.glowRing.visible) {
          const ringAlpha = 0.45 + ((Math.sin(masterTick * 0.08) + 1) / 2) * 0.55;
          node.glowRing.alpha = ringAlpha;
        }
      });
    });

    // ── WebSocket ─────────────────────────────────────────────────────────────
    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen  = () => { if (!isDestroyed) setConnectionStatus('connected'); };
        ws.onclose = () => { if (!isDestroyed) { setConnectionStatus('disconnected'); setTimeout(connectWs, 3000); } };
        ws.onerror = () => { if (!isDestroyed) setConnectionStatus('disconnected'); };
        ws.onmessage = (ev) => {
          if (isDestroyed) return;
          try {
            const data = JSON.parse(ev.data);
            if (data.type === 'initial_state' && Array.isArray(data.agents)) {
              data.agents.forEach((ag: any) => {
                const id = ag.agentId || ag.id;
                if (id && updateAgentStateRef.current) updateAgentStateRef.current(id, ag.status);
              });
            }
            const agentId = data.agent_id || data.agentId;
            const status  = data.status as AgentStatus;
            if (agentId && status && updateAgentStateRef.current) updateAgentStateRef.current(agentId, status);
          } catch (e) {
            console.error('[OfficeCanvas] WS parse error:', e);
          }
        };
      } catch (err) {
        setConnectionStatus('disconnected');
      }
    };

    connectWs();

    return () => {
      isDestroyed = true;
      if (ws) { ws.close(); ws = null; }
      try { app.destroy(true, { children: true, texture: false, baseTexture: false }); } catch (e) {/**/}
    };
  }, [wsUrl]);

  // ── Status badge display ──────────────────────────────────────────────────
  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'working':    return { dot: '#22c55e', text: 'WORKING',  color: '#86efac' };
      case 'debugging':  return { dot: '#22c55e', text: 'DEBUG',    color: '#86efac' };
      case 'token_swap':
      case 'token':      return { dot: '#eab308', text: 'TOKEN',    color: '#fde047' };
      case 'on_break':
      case 'cooldown':   return { dot: '#ef4444', text: 'BREAK',    color: '#fca5a5' };
      case 'done':       return { dot: '#06b6d4', text: 'DONE',     color: '#67e8f9' };
      case 'blocked':    return { dot: '#dc2626', text: 'BLOCKED',  color: '#fca5a5' };
      default:           return { dot: '#64748b', text: 'IDLE',     color: '#94a3b8' };
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Connection Status Indicator */}
      <div
        style={{
          position: 'absolute', top: 16, left: 20, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(8px)',
          padding: '5px 12px', borderRadius: 20,
          border: '1px solid rgba(51,65,85,0.8)',
          fontSize: 11, color: '#f8fafc',
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: connectionStatus === 'connected' ? '#22c55e' : connectionStatus === 'connecting' ? '#eab308' : '#ef4444',
          boxShadow: connectionStatus === 'connected' ? '0 0 6px #22c55e' : 'none',
        }} />
        <span style={{ fontWeight: 600, textTransform: 'capitalize', letterSpacing: '0.5px' }}>
          {connectionStatus}
        </span>
      </div>

      {/* HTML Overlay Agent Badges — above canvas, no CSS transitions */}
      {AGENTS.map((agent) => {
        const status = agentStatuses[agent.id] || 'idle';
        const badge  = getStatusBadge(status);
        const leftPct = ((agent.gridCol * 2 + 1) / 8) * 100;
        const topPct  = ((agent.gridRow * 2 + 1) / 6) * 100;

        return (
          <div
            key={agent.id}
            onClick={() => onAgentSelect && onAgentSelect(agent.id)}
            style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: 'translate(-50%, -58px)',
              zIndex: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              cursor: 'pointer', userSelect: 'none',
              // NOTE: No CSS transition here — badge state swaps are instant
            }}
          >
            <div style={{
              background: 'rgba(11,19,41,0.94)',
              border: '1px solid rgba(30,41,59,0.9)',
              borderRadius: 8,
              padding: '3px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              minWidth: 78,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.6px' }}>
                {agent.code}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: badge.dot,
                  boxShadow: status === 'working' ? '0 0 5px #22c55e' : status === 'token_swap' ? '0 0 5px #eab308' : 'none',
                }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: badge.color, letterSpacing: '0.4px' }}>
                  {badge.text}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* PixiJS Canvas mount — all animation lives inside the Ticker above */}
      <div
        ref={canvasContainerRef}
        style={{
          width: '100%',
          aspectRatio: '1000 / 660',
          background: '#090e1a',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          // Pixel-perfect at the container level too
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
