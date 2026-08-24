# Folder Structure

Give Antigravity this structure as the target — it should create/fill these, not invent its own layout.

```
ai-dev-team-builder/
├── MASTER_PROMPT.md            # already have this
├── agents.config.json          # already have this
├── .env.example                # already have this
├── .env                        # you fill this in, gitignored
├── package.json
├── orchestrator/
│   ├── index.js                # entry point, starts express + ws + redis
│   ├── stateMachine.js         # agent status transitions (idle/working/on_break/etc)
│   ├── queue.js                # task queue (redis-backed or in-memory)
│   ├── agentLoader.js          # reads agents.config.json, instantiates agent clients
│   ├── apiClients/
│   │   ├── groq.js
│   │   ├── gemini.js
│   │   ├── openrouter.js
│   │   ├── together.js
│   │   ├── cerebras.js
│   │   ├── deepseek.js
│   │   ├── huggingface.js
│   │   ├── githubModels.js
│   │   └── ollamaFallback.js
│   ├── fallback.js             # rate-limit catch + fallback_pairs routing + cooldown timer
│   └── pipeline.js             # milestone 2: brief -> subtasks -> dependency-ordered execution
│
├── dashboard/                  # Next.js app
│   ├── pages/ or app/
│   │   └── index.tsx           # two-panel layout: office canvas + live site preview
│   ├── components/
│   │   ├── OfficeCanvas.tsx    # PixiJS/Phaser mount, one sprite per agent
│   │   ├── AgentSprite.tsx     # sprite state -> animation frame mapping
│   │   └── SitePreview.tsx     # iframe streaming generated files
│   ├── lib/
│   │   └── wsClient.ts         # websocket connection to orchestrator
│   └── public/sprites/         # desk/character sprite sheets
│
├── generated-site/             # OUTPUT: the actual website the agents build
│   └── (populated at runtime — gitignore contents, keep .gitkeep)
│
└── docs/
    └── README-template.md      # docs_writer agent fills this in per generated project
```

## Setup order (tell Antigravity to follow this)

1. `npm init` at root, install: `express`, `ws`, `ioredis` (or skip redis for v1 and use an in-memory array queue), `dotenv`.
2. Scaffold `orchestrator/agentLoader.js` first — just load and console.log the 12 agents from config to confirm parsing works.
3. Build `stateMachine.js` + `fallback.js` before writing a single API client — get the state transitions and fallback routing solid with **mock** agents (return fake responses) so you're not burning API quota while debugging logic.
4. Only once mocked pipeline runs end-to-end, wire in real API clients one at a time (start with Groq + Gemini since those are the most reliable free tiers).
5. Then scaffold the Next.js dashboard, websocket wiring, and finally the PixiJS office animation last — it's the part most likely to eat time, and everything else needs to work before it's worth polishing.

## Multi-laptop note
Don't set up `WORKER_ROLES` distribution until steps 1–4 work fully on one machine. Get the single-machine version demo-able first, then split.
