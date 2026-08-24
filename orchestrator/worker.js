import { WebSocket } from 'ws';
import dotenv from 'dotenv';
import { agentLoader } from './agentLoader.js';
import { UniversalApiClient } from './universalApiClient.js';

dotenv.config();

const ORCHESTRATOR_WS = process.env.ORCHESTRATOR_WS_URL || 'ws://localhost:4001';
const WORKER_ROLES = process.env.WORKER_ROLES
  ? process.env.WORKER_ROLES.split(',').map((r) => r.trim().toLowerCase())
  : [];

console.log(`\n===============================================================`);
console.log(`  THE OFFICE - Distributed Agent Worker Process                 `);
console.log(`  Connecting to: ${ORCHESTRATOR_WS}                            `);
console.log(`  Assigned Roles: ${WORKER_ROLES.length > 0 ? WORKER_ROLES.join(', ') : 'ALL (default)'}`);
console.log(`===============================================================\n`);

let ws;

function connect() {
  ws = new WebSocket(ORCHESTRATOR_WS);

  ws.on('open', () => {
    console.log(`[Worker] Connected to Orchestrator at ${ORCHESTRATOR_WS}`);
    // Register roles with orchestrator
    ws.send(
      JSON.stringify({
        type: 'worker_register',
        roles: WORKER_ROLES,
        machineId: process.env.WORKER_MACHINE_ID || 'worker_node',
      })
    );
  });

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.type === 'execute_task') {
        const { taskId, role, userPrompt, context } = data;
        console.log(`[Worker] Received task "${taskId}" for role [${role}]`);

        const agent = agentLoader.getAgent(role);
        if (!agent) {
          ws.send(
            JSON.stringify({
              type: 'task_result',
              taskId,
              error: `Role ${role} not recognized on this worker`,
            })
          );
          return;
        }

        try {
          const result = await UniversalApiClient.executeAgentCall(agent, userPrompt);
          ws.send(
            JSON.stringify({
              type: 'task_result',
              taskId,
              role,
              output: result.text,
              tokensUsed: result.tokensUsed,
            })
          );
        } catch (err) {
          console.error(`[Worker] Error executing task ${taskId}:`, err.message);
          ws.send(
            JSON.stringify({
              type: 'task_result',
              taskId,
              role,
              error: err.message,
              isRateLimit: err.status === 429 || err.message?.includes('429'),
            })
          );
        }
      }
    } catch (e) {
      console.error('[Worker] Message handling error:', e);
    }
  });

  ws.on('close', () => {
    console.warn('[Worker] Connection lost. Reconnecting in 3s...');
    setTimeout(connect, 3000);
  });

  ws.on('error', (err) => {
    console.error('[Worker] WS Error:', err.message);
  });
}

connect();
