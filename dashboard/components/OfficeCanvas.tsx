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
  // Row 0 (Cols 0-3)
  { id: 'pm', code: 'A01-PM', name: 'PM / Brain', colIndex: 0, gridRow: 0, gridCol: 0 },
  { id: 'idea', code: 'A02-IDEA', name: 'Idea Gen', colIndex: 1, gridRow: 0, gridCol: 1 },
  { id: 'designer', code: 'A03-DESIGNER', name: 'UI/UX Designer', colIndex: 2, gridRow: 0, gridCol: 2 },
  { id: 'html_dev', code: 'A04-HTML', name: 'HTML Dev', colIndex: 3, gridRow: 0, gridCol: 3 },

  // Row 1 (Cols 0-3)
  { id: 'css_dev', code: 'A05-CSS', name: 'CSS Dev', colIndex: 4, gridRow: 1, gridCol: 0 },
  { id: 'js_dev', code: 'A06-JS', name: 'JS Dev', colIndex: 5, gridRow: 1, gridCol: 1 },
  { id: 'animation_dev', code: 'A07-ANIM', name: 'Animation Dev', colIndex: 6, gridRow: 1, gridCol: 2 },
  { id: 'backend_dev', code: 'A08-BACKEND', name: 'Backend Dev', colIndex: 7, gridRow: 1, gridCol: 3 },

  // Row 2 (Cols 0-3)
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
  badgeBg: PIXI.Graphics;
  badgeTitle: PIXI.Text;
  statusDot: PIXI.Graphics;
  statusText: PIXI.Text;
  status: AgentStatus;
  baseY: number;
  bounceOffset: number;
  textures: AgentTextures | null;
  breakSprite: PIXI.AnimatedSprite | PIXI.Sprite | null;
}

const CANVAS_WIDTH = 1100;
const CANVAS_HEIGHT = 760;

// Spacious 3-Row x 4-Column Office Grid (Generous Padding & Zero Overlap)
const START_X = 150;
const START_Y = 175;
const SPACING_X = 245;
const SPACING_Y = 205;

// Coffee Break Station Anchor (Top Right)
const COFFEE_STATION_X = 960;
const COFFEE_STATION_Y = 65;

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

    // 1. Configure Nearest-Neighbor Pixel Art Sharpness Globally
    if (PIXI.settings) {
      PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
      PIXI.settings.ROUND_PIXELS = true;
    }

    // 2. Initialize Pixi Application
    const app = new PIXI.Application({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: 0x090e1a, // Deep slate background
      antialias: false,
      resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      autoDensity: true,
    });

    const canvasElement = (app.view || (app as any).canvas) as HTMLCanvasElement;
    if (canvasElement && containerRef.current) {
      canvasElement.style.width = '100%';
      canvasElement.style.height = '100%';
      canvasElement.style.borderRadius = '14px';
      canvasElement.style.boxShadow = '0 14px 35px -4px rgba(0, 0, 0, 0.65)';
      canvasElement.style.imageRendering = 'pixelated';
      containerRef.current.appendChild(canvasElement);
    }

    // 3. Layer Management
    const floorLayer = new PIXI.Container();
    const deskLayer = new PIXI.Container();
    const walkerLayer = new PIXI.Container();

    app.stage.addChild(floorLayer);
    app.stage.addChild(deskLayer);
    app.stage.addChild(walkerLayer);

    // 4. Render Office Floor & Coffee Lounge
    const drawFloorPlan = () => {
      const g = new PIXI.Graphics();

      // Main Floor Area
      g.beginFill(0x0f172a);
      g.drawRoundedRect(16, 16, CANVAS_WIDTH - 32, CANVAS_HEIGHT - 32, 18);
      g.endFill();

      // Cyberpunk Grid Lines
      g.lineStyle(1, 0x1e293b, 0.35);
      for (let x = 40; x < CANVAS_WIDTH - 40; x += 40) {
        g.moveTo(x, 24);
        g.lineTo(x, CANVAS_HEIGHT - 24);
      }
      for (let y = 40; y < CANVAS_HEIGHT - 40; y += 40) {
        g.moveTo(24, y);
        g.lineTo(CANVAS_WIDTH - 24, y);
      }

      // Department Outer Frame
      g.lineStyle(2, 0x38bdf8, 0.15);
      g.drawRoundedRect(32, 85, CANVAS_WIDTH - 64, CANVAS_HEIGHT - 105, 14);

      // Dedicated Coffee Lounge Area (Top Right)
      g.beginFill(0x1c1410, 0.95);
      g.lineStyle(2, 0xf97316, 0.45);
      g.drawRoundedRect(COFFEE_STATION_X - 115, COFFEE_STATION_Y - 42, 230, 84, 12);
      g.endFill();

      // Coffee Counter Graphic
      g.beginFill(0x2d1a10);
      g.lineStyle(1.5, 0x7c2d12);
      g.drawRoundedRect(COFFEE_STATION_X - 25, COFFEE_STATION_Y - 20, 60, 36, 6);
      g.endFill();

      // Espresso Machine
      g.beginFill(0x451a03);
      g.lineStyle(1, 0xf97316);
      g.drawRoundedRect(COFFEE_STATION_X - 15, COFFEE_STATION_Y - 14, 40, 24, 4);
      g.endFill();

      floorLayer.addChild(g);

      // Lounge Labels
      const coffeeTitle = new PIXI.Text('☕ COFFEE & BREAK LOUNGE', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0xf97316,
        letterSpacing: 0.8,
      });
      coffeeTitle.x = COFFEE_STATION_X - 105;
      coffeeTitle.y = COFFEE_STATION_Y - 34;
      floorLayer.addChild(coffeeTitle);

      const coffeeDesc = new PIXI.Text('Dual Animation Break Zone', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 9,
        fill: 0x94a3b8,
      });
      coffeeDesc.x = COFFEE_STATION_X - 105;
      coffeeDesc.y = COFFEE_STATION_Y + 22;
      floorLayer.addChild(coffeeDesc);
    };

    drawFloorPlan();

    // 5. Fallback Textures Generator (High-Detail Vector Fallbacks)
    const createFallbackTextures = (agent: AgentMetadata): AgentTextures => {
      const createTexture = (label: string, color: number) => {
        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawRoundedRect(0, 0, 48, 56, 8);
        g.endFill();

        g.beginFill(0xffffff, 0.9);
        g.drawCircle(24, 18, 10);
        g.endFill();

        g.beginFill(0x0f172a, 0.8);
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

    // 6. Build 12 Desk Stations & Floating Overlay Badges
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

        // Glowing Pulse Ring for Token Swap State
        const glowRing = new PIXI.Graphics();
        glowRing.lineStyle(3, 0xeab308, 0.9);
        glowRing.drawRoundedRect(-52, -36, 104, 96, 16);
        glowRing.visible = false;
        stationContainer.addChild(glowRing);

        // Desk Graphics & Shadow
        const deskGraphic = new PIXI.Graphics();
        deskGraphic.beginFill(0x000000, 0.45);
        deskGraphic.drawEllipse(0, 42, 54, 14);
        deskGraphic.endFill();

        // Workstation Table Surface
        deskGraphic.beginFill(0x1e293b);
        deskGraphic.lineStyle(1.5, 0x334155);
        deskGraphic.drawRoundedRect(-48, 12, 96, 38, 6);
        deskGraphic.endFill();

        // Monitor Screen
        deskGraphic.beginFill(0x0a0f1d);
        deskGraphic.lineStyle(1, 0x38bdf8, 0.7);
        deskGraphic.drawRoundedRect(-22, 16, 44, 22, 3);
        deskGraphic.endFill();

        // Monitor Stand
        deskGraphic.beginFill(0x64748b);
        deskGraphic.drawRect(-4, 38, 8, 4);
        deskGraphic.drawRect(-10, 41, 20, 2);
        deskGraphic.endFill();

        stationContainer.addChild(deskGraphic);

        const fallbackTex = createFallbackTextures(agent);

        // Character Sprite (Scaled accurately)
        const sprite = new PIXI.Sprite(fallbackTex.idle);
        sprite.anchor.set(0.5, 0.88);
        sprite.x = 0;
        sprite.y = 24;
        sprite.width = 68;
        sprite.height = 100;
        stationContainer.addChild(sprite);

        // --- NON-OVERLAPPING OVERLAY BADGE (yOffset = -85px) ---
        const badgeContainer = new PIXI.Container();
        badgeContainer.y = -85; // Placed well above character sprite head

        // Semi-transparent Dark Card (bg-slate-900/90)
        const badgeBg = new PIXI.Graphics();
        badgeBg.beginFill(0x0b1329, 0.94);
        badgeBg.lineStyle(1, 0x1e293b, 0.85);
        badgeBg.drawRoundedRect(-54, -20, 108, 38, 8);
        badgeBg.endFill();
        badgeContainer.addChild(badgeBg);

        // Top Label: Agent ID (e.g. A01-PM)
        const badgeTitle = new PIXI.Text(agent.code, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 10,
          fontWeight: 'bold',
          fill: 0x38bdf8,
          letterSpacing: 0.6,
        });
        badgeTitle.anchor.set(0.5, 0);
        badgeTitle.y = -15;
        badgeContainer.addChild(badgeTitle);

        // Status Indicator Dot (🟢 Working, 🔴 On Break, 🟡 Token, ⚪ Idle)
        const statusDot = new PIXI.Graphics();
        statusDot.beginFill(0x64748b);
        statusDot.drawCircle(-32, 8, 3.5);
        statusDot.endFill();
        badgeContainer.addChild(statusDot);

        // Status Pill Text
        const statusText = new PIXI.Text('IDLE', {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 8,
          fontWeight: 'bold',
          fill: 0x94a3b8,
          letterSpacing: 0.5,
        });
        statusText.anchor.set(0, 0.5);
        statusText.x = -24;
        statusText.y = 8;
        badgeContainer.addChild(statusText);

        stationContainer.addChild(badgeContainer);
        deskLayer.addChild(stationContainer);

        deskNodes.set(agent.id, {
          agent,
          container: stationContainer,
          deskGraphic,
          glowRing,
          sprite,
          badgeContainer,
          badgeBg,
          badgeTitle,
          statusDot,
          statusText,
          status: 'idle',
          baseY: 24,
          bounceOffset: 0,
          textures: fallbackTex,
          breakSprite: null,
        });
      });
    };

    buildDeskStations();

    // 7. EXACT Sprite Sheet Slicing Math & Transparency Extraction
    const initSpritesheetWithBaseTexture = (baseTexture: PIXI.BaseTexture) => {
      if (!baseTexture || baseTexture.width <= 0 || baseTexture.height <= 0) return;

      baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
      const frameWidth = baseTexture.width / 12;
      const frameHeight = baseTexture.height / 4;

      console.log(
        `[OfficeCanvas] Slicing BaseTexture: ${baseTexture.width}x${baseTexture.height} | Frame: ${frameWidth.toFixed(1)}x${frameHeight.toFixed(1)}`
      );

      // EXACT function to extract a single frame
      function getFrame(col: number, row: number) {
        return new PIXI.Texture(
          baseTexture,
          new PIXI.Rectangle(col * frameWidth, row * frameHeight, frameWidth, frameHeight)
        );
      }

      AGENTS_LIST.forEach((agent) => {
        const col = agent.colIndex;
        const slicedTextures: AgentTextures = {
          idle: getFrame(col, 0),      // Row 0: Idle (front standing)
          working: getFrame(col, 1),   // Row 1: Working (typing)
          tokenSwap: getFrame(col, 2), // Row 2: Token swap
          sideWalk: getFrame(col, 3),  // Row 3: Walking (profile pose)
        };

        const node = deskNodes.get(agent.id);
        if (node) {
          node.textures = slicedTextures;
          node.sprite.texture = slicedTextures.idle;
          // Set accurate proportional pixel art display size
          node.sprite.width = 68;
          node.sprite.height = (frameHeight / frameWidth) * 68;
          updateNodeAppearance(node, node.status);
        }
      });
    };

    // Load Image with White-Background Chromakey to Transparency
    const loadProcessedSpriteSheet = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/assets/agents-spritesheet.png';

      img.onload = () => {
        if (isDestroyed) return;
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // Strip pure/near-white background to transparent
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(imgData, 0, 0);

          const baseTex = PIXI.BaseTexture.from(canvas);
          initSpritesheetWithBaseTexture(baseTex);
        } else {
          // Direct fallback
          const baseTex = PIXI.BaseTexture.from(img);
          initSpritesheetWithBaseTexture(baseTex);
        }
      };

      img.onerror = () => {
        // Direct BaseTexture fallback
        const baseTex = PIXI.BaseTexture.from('/assets/agents-spritesheet.png');
        if (baseTex.valid) {
          initSpritesheetWithBaseTexture(baseTex);
        } else {
          baseTex.on('loaded', () => initSpritesheetWithBaseTexture(baseTex));
        }
      };
    };

    loadProcessedSpriteSheet();

    // 8. Pre-load Coffee Drinking Animation Frames
    let coffeeDrinkingTextures: PIXI.Texture[] = [];
    const loadCoffeeDrinkingFrames = async () => {
      try {
        const framePromises: Promise<PIXI.Texture>[] = [];
        for (let i = 1; i <= 30; i++) {
          const frameNum = String(i).padStart(3, '0');
          framePromises.push(PIXI.Assets.load(`/assets/coffee_drinking/frame_${frameNum}.png`));
        }
        const loaded = await Promise.all(framePromises);
        if (!isDestroyed) {
          coffeeDrinkingTextures = loaded.filter(Boolean);
          console.log(`[OfficeCanvas] Loaded ${coffeeDrinkingTextures.length} coffee drinking animation frames.`);
        }
      } catch (err) {
        console.warn('[OfficeCanvas] Coffee drinking animation preload note:', err);
      }
    };

    loadCoffeeDrinkingFrames();

    // 9. Update Agent Node State & Visual Appearance
    const updateNodeAppearance = (node: DeskNode, rawStatus: string) => {
      const status = rawStatus.toLowerCase() as AgentStatus;
      node.status = status;

      let dotColor = 0x64748b; // Slate
      let textColor = 0x94a3b8;
      let label = 'IDLE';

      switch (status) {
        case 'working':
        case 'debugging':
          dotColor = 0x22c55e; // Green
          textColor = 0x86efac;
          label = status === 'debugging' ? 'DEBUGGING' : 'WORKING';
          node.sprite.visible = true;
          if (node.textures) node.sprite.texture = node.textures.working;
          node.glowRing.visible = false;
          cleanupBreakAnimation(node);
          break;

        case 'token_swap':
        case 'token':
          dotColor = 0xeab308; // Yellow
          textColor = 0xfde047;
          label = 'TOKEN';
          node.sprite.visible = true;
          if (node.textures) node.sprite.texture = node.textures.tokenSwap;
          node.glowRing.visible = true;
          cleanupBreakAnimation(node);
          break;

        case 'on_break':
        case 'cooldown':
          dotColor = 0xef4444; // Red
          textColor = 0xfca5a5;
          label = 'ON BREAK';
          node.sprite.visible = false;
          node.glowRing.visible = false;
          triggerDualBreakAnimation(node);
          break;

        case 'blocked':
          dotColor = 0xdc2626; // Red
          textColor = 0xfca5a5;
          label = 'BLOCKED';
          node.sprite.visible = true;
          if (node.textures) node.sprite.texture = node.textures.idle;
          node.glowRing.visible = false;
          cleanupBreakAnimation(node);
          break;

        case 'done':
          dotColor = 0x06b6d4; // Cyan
          textColor = 0x67e8f9;
          label = 'DONE';
          node.sprite.visible = true;
          if (node.textures) node.sprite.texture = node.textures.idle;
          node.glowRing.visible = false;
          cleanupBreakAnimation(node);
          break;

        case 'idle':
        default:
          dotColor = 0x64748b;
          textColor = 0x94a3b8;
          label = 'IDLE';
          node.sprite.visible = true;
          if (node.textures) node.sprite.texture = node.textures.idle;
          node.glowRing.visible = false;
          cleanupBreakAnimation(node);
          break;
      }

      // Update Status Indicator Dot
      node.statusDot.clear();
      node.statusDot.beginFill(dotColor);
      node.statusDot.drawCircle(-32, 8, 3.5);
      node.statusDot.endFill();

      // Update Status Text
      node.statusText.text = label;
      node.statusText.style.fill = textColor;

      // Update active stats
      let w = 0, b = 0, idl = 0;
      deskNodes.forEach((n) => {
        if (n.status === 'working' || n.status === 'debugging') w++;
        else if (n.status === 'on_break' || n.status === 'cooldown') b++;
        else idl++;
      });
      setActiveCount({ working: w, onBreak: b, idle: idl });
    };

    // 10. Dual Break Animation Engine
    const triggerDualBreakAnimation = (node: DeskNode) => {
      cleanupBreakAnimation(node);

      const startX = node.container.x;
      const startY = node.container.y;
      const targetX = COFFEE_STATION_X - 50 + (Math.random() * 40 - 20);
      const targetY = COFFEE_STATION_Y + (Math.random() * 20 - 10);

      // Create walking sprite (Row 3 Side Walk Texture)
      let walker: PIXI.Sprite | PIXI.AnimatedSprite;

      if (node.textures) {
        walker = new PIXI.Sprite(node.textures.sideWalk);
        walker.width = 68;
        walker.height = 100;
      } else {
        const g = new PIXI.Graphics();
        g.beginFill(0xf97316);
        g.drawCircle(0, 0, 16);
        g.endFill();
        walker = new PIXI.Sprite(app.renderer.generateTexture(g));
      }

      walker.anchor.set(0.5, 0.88);
      walker.x = startX;
      walker.y = startY;
      walkerLayer.addChild(walker);
      node.breakSprite = walker;

      let progress = 0;
      const walkSpeed = 0.009;

      const walkTicker = (delta: number) => {
        if (isDestroyed || !node.breakSprite || (node.status !== 'on_break' && node.status !== 'cooldown')) {
          app.ticker.remove(walkTicker);
          cleanupBreakAnimation(node);
          node.sprite.visible = true;
          return;
        }

        if (progress < 1) {
          progress += walkSpeed * delta;
          walker.x = startX + (targetX - startX) * progress;
          walker.y = startY + (targetY - startY) * progress + Math.sin(progress * 24) * 2.5;
        } else {
          // Reached Coffee Station: Switch to Coffee Drinking Animation
          app.ticker.remove(walkTicker);

          if (coffeeDrinkingTextures.length > 0) {
            walkerLayer.removeChild(walker);
            walker.destroy();

            const drinkingAnim = new PIXI.AnimatedSprite(coffeeDrinkingTextures);
            drinkingAnim.animationSpeed = 0.22;
            drinkingAnim.anchor.set(0.5, 0.88);
            drinkingAnim.x = targetX;
            drinkingAnim.y = targetY;
            drinkingAnim.width = 68;
            drinkingAnim.height = 100;
            drinkingAnim.play();

            walkerLayer.addChild(drinkingAnim);
            node.breakSprite = drinkingAnim;
          }
        }
      };

      app.ticker.add(walkTicker);
    };

    const cleanupBreakAnimation = (node: DeskNode) => {
      if (node.breakSprite) {
        walkerLayer.removeChild(node.breakSprite);
        node.breakSprite.destroy();
        node.breakSprite = null;
      }
    };

    // 11. Master Animation Ticker (Typing Sine Bounce & Glowing Rings)
    let tickerTime = 0;
    app.ticker.add((delta) => {
      tickerTime += delta * 0.05;

      deskNodes.forEach((node) => {
        // Typing Bounce Animation (Row 1 Working)
        if (node.status === 'working' || node.status === 'debugging') {
          node.bounceOffset = Math.sin(tickerTime * 8 + node.agent.colIndex) * 1.5;
          node.sprite.y = node.baseY + node.bounceOffset;
        } else {
          node.sprite.y = node.baseY;
        }

        // Pulsing Golden Ring (Row 2 Token Swap)
        if (node.glowRing.visible) {
          const pulse = (Math.sin(tickerTime * 10) + 1) / 2;
          node.glowRing.alpha = 0.45 + pulse * 0.55;
          node.glowRing.scale.set(1 + pulse * 0.04);
        }
      });
    });

    // 12. WebSocket Synchronizer Engine
    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isDestroyed) return;
          console.log(`[OfficeCanvas] Connected to Orchestrator WS at ${wsUrl}`);
          setConnectionStatus('connected');
        };

        ws.onmessage = (event) => {
          if (isDestroyed) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'initial_state' && Array.isArray(data.agents)) {
              data.agents.forEach((ag: any) => {
                const node = deskNodes.get(ag.agentId || ag.id);
                if (node && ag.status) {
                  updateNodeAppearance(node, ag.status);
                }
              });
            }

            const agentId = data.agent_id || data.agentId;
            const status = data.status;

            if (agentId && status) {
              const node = deskNodes.get(agentId);
              if (node) {
                updateNodeAppearance(node, status);
              }
            }
          } catch (e) {
            console.error('[OfficeCanvas] WS payload parse error:', e);
          }
        };

        ws.onclose = () => {
          if (isDestroyed) return;
          setConnectionStatus('disconnected');
          setTimeout(connectWs, 3000);
        };

        ws.onerror = (err) => {
          if (isDestroyed) return;
          console.warn('[OfficeCanvas] WS connection notice:', err);
        };
      } catch (err) {
        console.error('[OfficeCanvas] Connection failure:', err);
        setConnectionStatus('disconnected');
      }
    };

    connectWs();

    // 13. Teardown on Component Unmount
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
    <div style={{ position: 'relative', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Floating Telemetry & Status Pill Bar */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '32px',
          zIndex: 10,
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(10px)',
          padding: '6px 16px',
          borderRadius: '24px',
          border: '1px solid rgba(51, 65, 85, 0.8)',
          fontSize: '12px',
          color: '#f8fafc',
          boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
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
              boxShadow: connectionStatus === 'connected' ? '0 0 10px #22c55e' : 'none',
            }}
          />
          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{connectionStatus}</span>
        </div>

        <span style={{ color: '#475569' }}>|</span>

        <div style={{ display: 'flex', gap: '12px' }}>
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
          aspectRatio: '1100 / 760',
          background: '#090e1a',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
