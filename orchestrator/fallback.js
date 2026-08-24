import { EventEmitter } from 'events';
import { agentLoader } from './agentLoader.js';
import { stateMachine } from './stateMachine.js';

export function simulateApiCall(agentId) {
  return new Promise((resolve, reject) => {
    const delay = Math.floor(Math.random() * 2000) + 1000;
    setTimeout(() => {
      const failed = Math.random() < 0.2;
      if (failed) {
        reject(new Error('Quota exceeded'));
      } else {
        resolve(`[Mock Output from ${agentId}] Completed task successfully.`);
      }
    }, delay);
  });
}

export class FallbackManager extends EventEmitter {
  constructor() {
    super();
    this.cooldownTimers = new Map();
  }

  handleAgentFailure(failedAgentId, task, error, customCooldown = null) {
    console.warn(
      `\x1b[33m[FallbackManager] Agent ${failedAgentId} encountered failure on task: ${task?.title || task?.id}\x1b[0m`
    );
    console.warn(`  Reason: ${error.message || error}`);

    // Mark failed agent on_break
    stateMachine.transition(failedAgentId, 'on_break', {
      currentTask: `Coffee break (Quota exhausted / rate limited)`,
    });

    const cooldownSec = customCooldown ?? agentLoader.onBreakCooldownSeconds;
    console.log(`[Cooldown] Starting ${cooldownSec}s cooldown for ${failedAgentId}...`);

    if (this.cooldownTimers.has(failedAgentId)) {
      clearTimeout(this.cooldownTimers.get(failedAgentId));
    }

    const timer = setTimeout(() => {
      console.log(`\x1b[32m[Cooldown End] ${failedAgentId} finished coffee break. Returning to idle.\x1b[0m`);
      stateMachine.transition(failedAgentId, 'idle', { currentTask: null });
      this.cooldownTimers.delete(failedAgentId);
      this.emit('cooldown:ended', { agentId: failedAgentId });
    }, cooldownSec * 1000);

    this.cooldownTimers.set(failedAgentId, timer);

    // Look up fallback pair
    const fallbackAgentId = agentLoader.getFallbackAgentId(failedAgentId);
    if (!fallbackAgentId) {
      console.error(`[FallbackManager] No configured fallback agent for ${failedAgentId}!`);
      stateMachine.transition(failedAgentId, 'blocked', { currentTask: 'Blocked (no fallback available)' });
      return { success: false, reason: 'no_fallback_available' };
    }

    console.log(
      `\x1b[36m[Fallback Action] Re-routing task "${task?.title || task?.id}" to fallback agent: ${fallbackAgentId}\x1b[0m`
    );

    return {
      success: true,
      failedAgentId,
      assignedAgentId: fallbackAgentId,
      cooldownSeconds: cooldownSec,
    };
  }
}

export const fallbackManager = new FallbackManager();

export class AgentExecutor {
  constructor(sm = stateMachine, fallbackPairs = agentLoader.fallbackPairs, onBreakCooldownSeconds = agentLoader.onBreakCooldownSeconds) {
    this.stateMachine = sm;
    this.fallbackPairs = fallbackPairs;
    this.onBreakCooldownSeconds = onBreakCooldownSeconds;
  }

  async runAgentTask(originalAgentId, currentAgentId = originalAgentId) {
    const currentStatus = this.stateMachine.getAgentStatus(currentAgentId);
    if (currentStatus === 'idle' || currentStatus === 'on_break' || currentStatus === 'blocked' || currentStatus === 'done') {
      this.stateMachine.setAgentStatus(currentAgentId, 'working');
    }

    console.log(`[Task Execution] Starting task for ${currentAgentId}...`);
    try {
      const result = await simulateApiCall(currentAgentId);
      console.log(`[Success] ${currentAgentId} returned: ${result}`);
      this.stateMachine.setAgentStatus(currentAgentId, 'done');
      return result;
    } catch (err) {
      console.log(`[Failure] ${currentAgentId} failed with error: ${err.message}`);

      const fallbackResult = fallbackManager.handleAgentFailure(
        currentAgentId,
        { id: `task_${currentAgentId}`, title: `Task for ${currentAgentId}` },
        err,
        this.onBreakCooldownSeconds
      );

      if (fallbackResult.success) {
        return this.runAgentTask(originalAgentId, fallbackResult.assignedAgentId);
      } else {
        throw err;
      }
    }
  }
}
