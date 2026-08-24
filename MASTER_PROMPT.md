# MASTER PROMPT — AI Dev Team Website Builder

## Project
Build "The Office" — a multi-agent system where 12 LLM-powered agents, each backed by a different free-tier API, collaborate in real time to design and build a complete website from a single user brief (e.g. "build me a portfolio site for a photographer"). The system is visualized as a live 2D animated office where each agent is a sprite at a desk, and includes automatic fallback ("coffee break") when an agent's API quota runs out.

## Tech stack
- **Orchestrator**: Node.js + Express — owns the task queue, agent state machine, and websocket hub.
- **Queue**: Redis (task queue + pub/sub for agent status events) or in-memory queue for v1.
- **Agent layer**: One module per role, each calling its assigned free API with a role-specific system prompt.
- **Frontend dashboard**: Next.js. Two panels:
  - Live 2D office (PixiJS canvas) — one sprite per agent, animated by websocket status events.
  - Output panel — live preview of the website being generated (render HTML/CSS/JS in an iframe as it updates).
- **Comms**: WebSocket between orchestrator and dashboard for real-time agent status + generated file diffs.
- **Distribution**: Orchestrator + dashboard on Machine A. Worker processes on Machines B, C, D connecting via LAN. `WORKER_ROLES` env var filters assigned agents.
- **Local fallback tier**: Ollama (`llama3.2:3b`) when all configured free APIs for a role are exhausted.

## Build Order
1. **Core state machine** (Milestone 1) — agent lifecycle: `idle` → `working` → (`debugging` | `blocked` | `on_break`) → `working` → `done`. Config loader. Console verification.
2. **Task pipeline** (Milestone 2) — PM breaks brief into subtasks → DAG dependency execution → outputs in `/generated-site`.
3. **Fallback logic** (Milestone 1/3) — rate-limit catch, mark `on_break`, requeue, fallback pairs, cooldown timer.
4. **Websocket + dashboard shell** (Milestone 4) — orchestrator emits events, dashboard listens.
5. **2D office animation** (Milestone 4) — PixiJS 12-desk canvas.
6. **Live output preview** (Milestone 4) — iframe code streaming.
7. **Multi-machine distribution** (Milestone 5) — `WORKER_ROLES`.
8. **Local Ollama fallback** (Milestone 5) — 13th tier fallback.
