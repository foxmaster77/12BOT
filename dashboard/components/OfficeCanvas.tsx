// components/OfficeCanvas.tsx
// Starter: 12 desks in a grid, one sprite per agent, state driven purely by
// websocket events from the orchestrator. No physics, no collision — just
// texture/frame swapping on status change.

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

type AgentStatus = "idle" | "working" | "debugging" | "blocked" | "on_break" | "done";

interface AgentEvent {
  agentId: string;
  status: AgentStatus;
  currentTask?: string;
}

// Desk layout: 12 agents in a 4x3 grid. Tweak spacing to match your art.
const DESK_POSITIONS: Record<string, { x: number; y: number }> = {
  pm: { x: 100, y: 100 },
  idea: { x: 300, y: 100 },
  designer: { x: 500, y: 100 },
  html_dev: { x: 700, y: 100 },
  css_dev: { x: 100, y: 300 },
  js_dev: { x: 300, y: 300 },
  animation_dev: { x: 500, y: 300 },
  backend_dev: { x: 700, y: 300 },
  db_dev: { x: 100, y: 500 },
  debugger_1: { x: 300, y: 500 },
  debugger_2: { x: 500, y: 500 },
  docs_writer: { x: 700, y: 500 },
};

// Which texture/frame to show per status. Point these at your actual
// spritesheet frame names once you've imported the Kenney/itch.io asset pack.
const STATUS_TEXTURE: Record<AgentStatus, string> = {
  idle: "char_idle.png",
  working: "char_typing_1.png", // alternate with char_typing_2.png on a timer for the loop
  debugging: "char_debug.png",
  blocked: "char_blocked.png",
  on_break: "char_coffee.png",
  done: "char_idle.png",
};

export default function OfficeCanvas({ wsUrl = "ws://localhost:4001" }: { wsUrl?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spritesRef = useRef<Record<string, PIXI.Sprite>>({});
  const labelsRef = useRef<Record<string, PIXI.Text>>({});

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      width: 900,
      height: 650,
      backgroundColor: 0xf0e6d2, // warm office floor tone
      antialias: true,
    });
    containerRef.current.appendChild(app.view as unknown as Node);

    // --- Build desks + sprites ---
    Object.entries(DESK_POSITIONS).forEach(([agentId, pos]) => {
      // Desk placeholder (swap for a real desk texture later)
      const desk = new PIXI.Graphics();
      desk.beginFill(0x8b5a2b);
      desk.drawRoundedRect(0, 0, 80, 50, 6);
      desk.endFill();
      desk.x = pos.x;
      desk.y = pos.y + 40;
      app.stage.addChild(desk);

      // Character sprite — starts on the "idle" texture.
      // PIXI.Texture.from() will 404 silently until you point it at real assets;
      // swap for PIXI.Assets.load(spritesheet) once you have the pack imported.
      const sprite = PIXI.Sprite.from(STATUS_TEXTURE.idle);
      sprite.width = 48;
      sprite.height = 48;
      sprite.x = pos.x + 16;
      sprite.y = pos.y;
      app.stage.addChild(sprite);
      spritesRef.current[agentId] = sprite;

      // Name label under the desk
      const label = new PIXI.Text(agentId, { fontSize: 12, fill: 0x333333 });
      label.x = pos.x;
      label.y = pos.y + 95;
      app.stage.addChild(label);
      labelsRef.current[agentId] = label;
    });

    // --- Websocket wiring ---
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (msg) => {
      const event: AgentEvent = JSON.parse(msg.data);
      const sprite = spritesRef.current[event.agentId];
      if (!sprite) return;

      sprite.texture = PIXI.Texture.from(STATUS_TEXTURE[event.status]);

      // Simple visual feedback beyond the texture swap:
      if (event.status === "on_break") {
        sprite.tint = 0xffddaa; // warm tint while on coffee break
      } else if (event.status === "blocked") {
        sprite.tint = 0xff8888; // red tint when blocked
      } else {
        sprite.tint = 0xffffff; // normal
      }

      const label = labelsRef.current[event.agentId];
      if (label && event.currentTask) {
        label.text = `${event.agentId}: ${event.status}`;
      }
    };
    ws.onerror = (e) => console.error("Office websocket error", e);

    return () => {
      ws.close();
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    };
  }, [wsUrl]);

  return <div ref={containerRef} style={{ width: 900, height: 650 }} />;
}
