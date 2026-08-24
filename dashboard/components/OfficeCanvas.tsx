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

interface AgentMetadata {
  id: string;
  code: string;
  name: string;
  colIndex: number;
  gridRow: number;
  gridCol: number;
}

const AGENTS_LIST: AgentMetadata[] = [
  { id: 'pm', code: 'A01-PM', name: 'PM / Brain', colIndex: 0, gridRow: 0, gridCol: 0 },
  { id: 'idea', code: 'A02-IDEA', name: 'Idea Gen', colIndex: 1, gridRow: 0, gridCol: 1 },
  { id: 'designer', code: 'A03-DESIGNER', name: 'UI/UX Designer', colIndex: 2, gridRow: 0, gridCol: 2 },
  { id: 'html_dev', code: 'A04-HTML', name: 'HTML Dev', colIndex: 3, gridRow: 0, gridCol: 3 },

  { id: 'css_dev', code: 'A05-CSS', name: 'CSS Dev', colIndex: 4, gridRow: 1, gridCol: 0 },
  { id: 'js_dev', code: 'A06-JS', name: 'JS Dev', colIndex: 5, gridRow: 1, gridCol: 1 },
  { id: 'animation_dev', code: 'A07-ANIM', name: 'Animation Dev', colIndex: 6, gridRow: 1, gridCol: 2 },
  { id: 'backend_dev', code: 'A08-BACKEND', name: 'Backend Dev', colIndex: 7, gridRow: 1, gridCol: 3 },

  { id: 'db_dev', code: 'A09-DB', name: 'Database Setup', colIndex: 8, gridRow: 2, gridCol: 0 },
  { id: 'debugger_1', code: 'A10-BUGGER1', name: 'Frontend QA', colIndex: 9, gridRow: 2, gridCol: 1 },
  { id: 'debugger_2', code: 'A11-BUGGER2', name: 'System QA', colIndex: 10, gridRow: 2, gridCol: 2 },
  { id: 'docs_writer', code: 'A12-DOCS', name: 'Docs Writer', colIndex: 11, gridRow: 2, gridCol: 3 },
];

interface AgentTextures {
  idle: PIXI.Texture;
  working: PIXI.Texture;
  tokenSwap: PIXI.Texture;
  sideWalk: PIXI.Texture;
}

interface DeskNode {
  agent: AgentMetadata;
  container: PIXI.Container;
  deskGraphic: PIXI.Graphics;
  glowRing: PIXI.Graphics;
  sprite: PIXI.Sprite;
  badgeContainer: PIXI.Container;
  pillBg: PIXI.Graphics;
  pillText: PIXI.Text;
  status: AgentStatus;
  baseY: number;
  bounceOffset: number;
  textures: AgentTextures | null;
  walkerSprite?: PIXI.AnimatedSprite | PIXI.Sprite | null;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

// Coordinates for the 3x4 grid layout
const START_X = 120;
const START_Y = 140;
const SPACING_X = 220;
const SPACING_Y = 180;

// Coordinates for the dedicated Coffee Break Station
const COFFEE_STATION_X = 860;
const COFFEE_STATION_Y = 60;

export default function OfficeCanvas({
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001',
  onAgentSelect,
}: OfficeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [activeCount, setActiveCount] = useState({ working: 0, onBreak: 0, idle: 12 });

  useEffect(() => {
    if (!containerRef.current) return;

    let isDestroyed = false;
    let ws: WebSocket | null = null;
    const deskNodes = new Map<string, DeskNode>();

    // 1. Initialize Pixi Application
    const app = new PIXI.Application({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: 0x0f172a, // Deep slate office background
      antialias: true,
      resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      autoDensity: true,
    });

    const canvasElement = (app.view || (app as any).canvas) as HTMLCanvasElement;
    if (canvasElement && containerRef.current) {
      canvasElement.style.width = '100%';
      canvasElement.style.height = '100%';
      canvasElement.style.borderRadius = '12px';
      canvasElement.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)';
      containerRef.current.appendChild(canvasElement);
    }

    // 2. Layers
    const floorLayer = new PIXI.Container();
    const deskLayer = new PIXI.Container();
    const walkerLayer = new PIXI.Container();
    const uiLayer = new PIXI.Container();

    app.stage.addChild(floorLayer);
    app.stage.addChild(deskLayer);
    app.stage.addChild(walkerLayer);
    app.stage.addChild(uiLayer);

    // 3. Render Floor Grid & Room Aesthetics
    const drawFloorPlan = () => {
      const g = new PIXI.Graphics();

      // Floor tiles
      g.beginFill(0x131d35);
      g.drawRoundedRect(16, 16, CANVAS_WIDTH - 32, CANVAS_HEIGHT - 32, 16);
      g.endFill();

      // Subtle isometric / grid lines
      g.lineStyle(1, 0x1e293b, 0.5);
      for (let x = 40; x < CANVAS_WIDTH - 40; x += 40) {
        g.moveTo(x, 24);
        g.lineTo(x, CANVAS_HEIGHT - 24);
      }
      for (let y = 40; y < CANVAS_HEIGHT - 40; y += 40) {
        g.moveTo(24, y);
        g.lineTo(CANVAS_WIDTH - 24, y);
      }

      // Department borders & zone markers
      g.lineStyle(2, 0x38bdf8, 0.2);
      g.drawRoundedRect(30, 80, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 100, 12);

      // Coffee Break Lounge Area (Top Right)
      g.beginFill(0x271e1b, 0.85);
      g.lineStyle(2, 0xf97316, 0.4);
      g.drawRoundedRect(COFFEE_STATION_X - 100, COFFEE_STATION_Y - 35, 200, 70, 10);
      g.endFill();

      floorLayer.addChild(g);

      // Lounge Labels
      const coffeeLabel = new PIXI.Text('☕ COFFEE & COOLDOWN LOUNGE', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0xf97316,
        letterSpacing: 1,
      });
      coffeeLabel.x = COFFEE_STATION_X - 90;
      coffeeLabel.y = COFFEE_STATION_Y - 25;
      floorLayer.addChild(coffeeLabel);

      const subLabel = new PIXI.Text('Break & Token Refill Zone', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 9,
        fill: 0x94a3b8,
      });
      subLabel.x = COFFEE_STATION_X - 90;
      subLabel.y = COFFEE_STATION_Y - 8;
      floorLayer.addChild(subLabel);
    };

    drawFloorPlan();

    // 4. Create Fallback Textures (in case image is loading or custom drawn)
    const createFallbackTextures = (agent: AgentMetadata): AgentTextures => {
      const createTexture = (label: string, color: number) => {
        const g = new PIXI.Graphics();
        // Body / avatar
        g.beginFill(color);
        g.drawRoundedRect(0, 0, 48, 56, 8);
        g.endFill();

        // Screen / face
        g.beginFill(0xffffff, 0.9);
        g.drawCircle(24, 18, 10);
        g.endFill();

        // Pose indicator
        g.beginFill(0x0f172a, 0.7);
        g.drawRoundedRect(8, 34, 32, 14, 4);
        g.endFill();

        const txt = new PIXI.Text(label, {
          fontSize: 8,
          fill: 0xffffff,
          fontWeight: 'bold',
        });
        txt.anchor.set(0.5);
        txt.x = 24;
        txt.y = 41;
        g.addChild(txt);

        return app.renderer.generateTexture(g);
      };

      return {
        idle: createTexture('IDLE', 0x3b82f6),
        working: createTexture('TYPE', 0x22c55e),
        tokenSwap: createTexture('SWIPE', 0xeab308),
        sideWalk: createTexture('WALK', 0xf97316),
      };
    };

    // 5. Build Desk Station & Overlay UI
    const buildDeskStations = () => {
      AGENTS_LIST.forEach((agent) => {
        const posX = START_X + agent.gridCol * SPACING_X;
        const posY = START_Y + agent.gridRow * SPACING_Y;

        const stationContainer = new PIXI.Container();
        stationContainer.x = posX;
        stationContainer.y = posY;
        stationContainer.eventMode = 'static';
        stationContainer.cursor = 'pointer';
        stationContainer.on('pointerdown', () => {
          if (onAgentSelect) onAgentSelect(agent.id);
        });

        // Glowing Pulse Ring (for token swap & active focus)
        const glowRing = new PIXI.Graphics();
        glowRing.lineStyle(3, 0xeab308, 0.8);
        glowRing.drawRoundedRect(-44, -30, 88, 80, 14);
        glowRing.visible = false;
        stationContainer.addChild(glowRing);

        // Desk Graphics (Office Desk & Workstation)
        const deskGraphic = new PIXI.Graphics();
        // Desk shadow
        deskGraphic.beginFill(0x000000, 0.35);
        deskGraphic.drawEllipse(0, 38, 48, 12);
        deskGraphic.endFill();

        // Wooden Desk Surface
        deskGraphic.beginFill(0x334155);
        deskGraphic.lineStyle(1.5, 0x475569);
        deskGraphic.drawRoundedRect(-40, 10, 80, 32, 6);
        deskGraphic.endFill();

        // Computer Monitor & Keyboard
        deskGraphic.beginFill(0x0f172a);
        deskGraphic.lineStyle(1, 0x38bdf8, 0.6);
        deskGraphic.drawRoundedRect(-18, 14, 36, 20, 3);
        deskGraphic.endFill();

        // Monitor Base
        deskGraphic.beginFill(0x64748b);
        deskGraphic.drawRect(-4, 34, 8, 3);
        deskGraphic.drawRect(-8, 37, 16, 2);
        deskGraphic.endFill();

        // Coffee Mug on desk
        deskGraphic.beginFill(0xf97316);
        deskGraphic.drawCircle(26, 24, 4);
        deskGraphic.endFill();

        stationContainer.addChild(deskGraphic);

        // Fallback default textures
        const fallbackTex = createFallbackTextures(agent);

        // Agent Character Sprite
        const sprite = new PIXI.Sprite(fallbackTex.idle);
        sprite.anchor.set(0.5, 0.8);
        sprite.x = 0;
        sprite.y = 20;
        sprite.width = 54;
        sprite.height = 54;
        stationContainer.addChild(sprite);

        // --- OVERLAY BADGE CONTAINER ---
        const badgeContainer = new PIXI.Container();
        badgeContainer.y = -42;

        // Card Container Background
        const badgeBg = new PIXI.Graphics();
        badgeBg.beginFill(0x0b1329, 0.92);
        badgeBg.lineStyle(1, 0x1e293b);
        badgeBg.drawRoundedRect(-52, -18, 104, 34, 8);
        badgeBg.endFill();
        badgeContainer.addChild(badgeBg);

        // Top Label: Agent ID (e.g. A01-PM)
        const agentIdText = new PIXI.Text(agent.code, {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 10,
          fontWeight: 'bold',
          fill: 0x38bdf8,
          letterSpacing: 0.5,
        });
        agentIdText.anchor.set(0.5, 0);
        agentIdText.y = -14;
        badgeContainer.addChild(agentIdText);

        // Bottom Pill: Status Indicator (WORKING / IDLE / TOKEN / ON BREAK)
        const pillBg = new PIXI.Graphics();
        pillBg.beginFill(0x334155);
        pillBg.drawRoundedRect(-38, 0, 76, 12, 6);
        pillBg.endFill();
        badgeContainer.addChild(pillBg);

        const pillText = new PIXI.Text('IDLE', {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 8,
          fontWeight: 'bold',
          fill: 0xf8fafc,
          letterSpacing: 0.5,
        });
        pillText.anchor.set(0.5);
        pillText.x = 0;
        pillText.y = 6;
        badgeContainer.addChild(pillText);

        stationContainer.addChild(badgeContainer);
        deskLayer.addChild(stationContainer);

        deskNodes.set(agent.id, {
          agent,
          container: stationContainer,
          deskGraphic,
          glowRing,
          sprite,
          badgeContainer,
          pillBg,
          pillText,
          status: 'idle',
          baseY: 20,
          bounceOffset: 0,
          textures: fallbackTex,
          walkerSprite: null,
        });
      });
    };

    buildDeskStations();

    // 6. Sprite Sheet Slicing Matrix Engine (12 Cols x 4 Rows)
    const loadSpriteSheetAndSlice = async () => {
      try {
        const spritesheetPath = '/assets/agents-spritesheet.png';
        const texture = await PIXI.Assets.load(spritesheetPath);
        if (!texture || isDestroyed) return;

        const sheetWidth = texture.width;
        const sheetHeight = texture.height;
        const frameWidth = sheetWidth / 12;
        const frameHeight = sheetHeight / 4;

        console.log(`[OfficeCanvas] Slicing spritesheet (${sheetWidth}x${sheetHeight}) -> Frame: ${frameWidth}x${frameHeight}`);

        const baseTex = texture.baseTexture || (texture as any).source;

        AGENTS_LIST.forEach((agent) => {
          const col = agent.colIndex;
          const getFrame = (row: number) => {
            const rect = new PIXI.Rectangle(col * frameWidth, row * frameHeight, frameWidth, frameHeight);
            return new PIXI.Texture(baseTex, rect);
          };

          const slicedTextures: AgentTextures = {
            idle: getFrame(0),      // Row 0: Idle
            working: getFrame(1),   // Row 1: Working (typing)
            tokenSwap: getFrame(2), // Row 2: Token swipe
            sideWalk: getFrame(3),  // Row 3: Side walk
          };

          const node = deskNodes.get(agent.id);
          if (node) {
            node.textures = slicedTextures;
            // Update texture based on current status
            updateNodeAppearance(node, node.status);
          }
        });
      } catch (err) {
        console.warn('[OfficeCanvas] Could not slice spritesheet, keeping vector fallback avatars:', err);
      }
    };

    loadSpriteSheetAndSlice();

    // 7. Coffee Break Frame Sequence Loader (frame_001.png to frame_030.png)
    let coffeeBreakTextures: PIXI.Texture[] = [];
    const loadCoffeeBreakFrames = async () => {
      try {
        const framePromises: Promise<PIXI.Texture>[] = [];
        for (let i = 1; i <= 30; i++) {
          const frameNum = String(i).padStart(3, '0');
          framePromises.push(PIXI.Assets.load(`/assets/coffee_break/frame_${frameNum}.png`));
        }
        const loaded = await Promise.all(framePromises);
        if (!isDestroyed) {
          coffeeBreakTextures = loaded.filter(Boolean);
          console.log(`[OfficeCanvas] Loaded ${coffeeBreakTextures.length} coffee break animation frames.`);
        }
      } catch (err) {
        console.warn('[OfficeCanvas] Using sideWalk sprites for coffee break walk:', err);
      }
    };

    loadCoffeeBreakFrames();

    // 8. Update Appearance & Badge based on Status
    const updateNodeAppearance = (node: DeskNode, rawStatus: string) => {
      const status = rawStatus.toLowerCase() as AgentStatus;
      node.status = status;

      // Status Pill colors & labels
      let pillColor = 0x64748b; // Gray
      let pillLabel = 'IDLE';

      switch (status) {
        case 'working':
        case 'debugging':
          pillColor = 0x22c55e; // Green
          pillLabel = status === 'debugging' ? 'DEBUGGING' : 'WORKING';
          node.sprite.visible = true;
          if (node.textures) node.sprite.texture = node.textures.working;
          node.glowRing.visible = false;
          break;

        case 'token_swap':
        case 'token':
          pillColor = 0xeab308; // Yellow
          pillLabel = 'TOKEN';
          node.sprite.visible = true;
          if (node.textures) node.sprite.texture = node.textures.tokenSwap;
          node.glowRing.visible = true;
          break;

        case 'on_break':
        case 'cooldown':
          pillColor = 0xef4444; // Red
          pillLabel = 'ON BREAK';
          // Hide stationary desk sprite and start walking sequence
          node.sprite.visible = false;
          node.glowRing.visible = false;
          triggerCoffeeBreakWalk(node);
          break;

        case 'blocked':
          pillColor = 0xb91c1c; // Dark Red
          pillLabel = 'BLOCKED';
          node.sprite.visible = true;
          if (node.textures) node.sprite.texture = node.textures.idle;
          node.glowRing.visible = false;
          break;

        case 'done':
          pillColor = 0x06b6d4; // Cyan
          pillLabel = 'DONE';
          node.sprite.visible = true;
          if (node.textures) node.sprite.texture = node.textures.idle;
          node.glowRing.visible = false;
          break;

        case 'idle':
        default:
          pillColor = 0x64748b; // Slate Gray
          pillLabel = 'IDLE';
          node.sprite.visible = true;
          if (node.textures) node.sprite.texture = node.textures.idle;
          node.glowRing.visible = false;
          break;
      }

      // Re-draw status pill
      node.pillBg.clear();
      node.pillBg.beginFill(pillColor);
      node.pillBg.drawRoundedRect(-38, 0, 76, 12, 6);
      node.pillBg.endFill();

      node.pillText.text = pillLabel;

      // Update counters for UI overview
      let w = 0, b = 0, idl = 0;
      deskNodes.forEach((n) => {
        if (n.status === 'working' || n.status === 'debugging') w++;
        else if (n.status === 'on_break' || n.status === 'cooldown') b++;
        else idl++;
      });
      setActiveCount({ working: w, onBreak: b, idle: idl });
    };

    // 9. Coffee Break Walker Animation System
    const triggerCoffeeBreakWalk = (node: DeskNode) => {
      // Remove any existing walker
      if (node.walkerSprite) {
        walkerLayer.removeChild(node.walkerSprite);
        node.walkerSprite.destroy();
        node.walkerSprite = null;
      }

      const startX = node.container.x;
      const startY = node.container.y;
      const targetX = COFFEE_STATION_X - 40 + (Math.random() * 60 - 30);
      const targetY = COFFEE_STATION_Y + 10 + (Math.random() * 20 - 10);

      let walker: PIXI.AnimatedSprite | PIXI.Sprite;

      if (coffeeBreakTextures.length > 0) {
        const anim = new PIXI.AnimatedSprite(coffeeBreakTextures);
        anim.animationSpeed = 0.2;
        anim.play();
        walker = anim;
      } else if (node.textures) {
        walker = new PIXI.Sprite(node.textures.sideWalk);
      } else {
        const g = new PIXI.Graphics();
        g.beginFill(0xf97316);
        g.drawCircle(0, 0, 16);
        g.endFill();
        walker = new PIXI.Sprite(app.renderer.generateTexture(g));
      }

      walker.anchor.set(0.5);
      walker.x = startX;
      walker.y = startY;
      walker.width = 46;
      walker.height = 46;
      walkerLayer.addChild(walker);
      node.walkerSprite = walker;

      // Walking Interpolation
      let progress = 0;
      const walkSpeed = 0.008;

      const walkTicker = (delta: number) => {
        if (isDestroyed || !node.walkerSprite || node.status !== 'on_break' && node.status !== 'cooldown') {
          app.ticker.remove(walkTicker);
          if (node.walkerSprite) {
            walkerLayer.removeChild(node.walkerSprite);
            node.walkerSprite.destroy();
            node.walkerSprite = null;
            node.sprite.visible = true;
          }
          return;
        }

        if (progress < 1) {
          progress += walkSpeed * delta;
          walker.x = startX + (targetX - startX) * progress;
          walker.y = startY + (targetY - startY) * progress + Math.sin(progress * 20) * 3;
        } else {
          // Stay at coffee station with a subtle idle breathing
          walker.y = targetY + Math.sin(Date.now() * 0.004) * 2;
        }
      };

      app.ticker.add(walkTicker);
    };

    // 10. Master Animation Ticker (Typing Bounce & Glowing Rings)
    let tickerTime = 0;
    app.ticker.add((delta) => {
      tickerTime += delta * 0.05;

      deskNodes.forEach((node) => {
        // Working Typing Bounce
        if (node.status === 'working' || node.status === 'debugging') {
          node.bounceOffset = Math.sin(tickerTime * 8 + node.agent.colIndex) * 2.5;
          node.sprite.y = node.baseY + node.bounceOffset;
        } else {
          node.sprite.y = node.baseY;
        }

        // Token Swipe Glowing Ring Animation
        if (node.glowRing.visible) {
          const pulse = (Math.sin(tickerTime * 10) + 1) / 2;
          node.glowRing.alpha = 0.4 + pulse * 0.6;
          node.glowRing.scale.set(1 + pulse * 0.05);
        }
      });
    });

    // 11. WebSocket Connection & Event Dispatcher
    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isDestroyed) return;
          console.log(`[OfficeCanvas] Connected to Orchestrator WebSocket: ${wsUrl}`);
          setConnectionStatus('connected');
        };

        ws.onmessage = (event) => {
          if (isDestroyed) return;
          try {
            const data = JSON.parse(event.data);

            // Handle bulk initial states
            if (data.type === 'initial_state' && Array.isArray(data.agents)) {
              data.agents.forEach((ag: any) => {
                const node = deskNodes.get(ag.agentId || ag.id);
                if (node && ag.status) {
                  updateNodeAppearance(node, ag.status);
                }
              });
            }

            // Handle single agent event: { agent_id / agentId, status }
            const agentId = data.agent_id || data.agentId;
            const status = data.status;

            if (agentId && status) {
              const node = deskNodes.get(agentId);
              if (node) {
                updateNodeAppearance(node, status);
              }
            }
          } catch (e) {
            console.error('[OfficeCanvas] WS Message error:', e);
          }
        };

        ws.onclose = () => {
          if (isDestroyed) return;
          setConnectionStatus('disconnected');
          setTimeout(connectWs, 3000);
        };

        ws.onerror = (err) => {
          if (isDestroyed) return;
          console.warn('[OfficeCanvas] WS Error:', err);
        };
      } catch (err) {
        console.error('[OfficeCanvas] Could not connect WS:', err);
        setConnectionStatus('disconnected');
      }
    };

    connectWs();

    // 12. Teardown & Garbage Collection on Unmount
    return () => {
      isDestroyed = true;
      if (ws) {
        ws.close();
        ws = null;
      }
      try {
        app.destroy(true, {
          children: true,
          texture: false,
          baseTexture: false,
        });
      } catch (e) {
        console.warn('[OfficeCanvas] Teardown warning:', e);
      }
    };
  }, [wsUrl, onAgentSelect]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Overlay Stats Bar */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '32px',
          zIndex: 10,
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(51, 65, 85, 0.8)',
          fontSize: '12px',
          color: '#f8fafc',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
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

        <span style={{ color: '#475569' }}>|</span>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>🟢 Working: {activeCount.working}</span>
          <span style={{ color: '#ef4444', fontWeight: 600 }}>☕ On Break: {activeCount.onBreak}</span>
          <span style={{ color: '#94a3b8' }}>⚪ Idle: {activeCount.idle}</span>
        </div>
      </div>

      {/* Canvas Mount Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          aspectRatio: '1000 / 700',
          background: '#090d16',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
