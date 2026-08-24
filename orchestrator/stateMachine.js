import { EventEmitter } from 'events';
import { agentLoader } from './agentLoader.js';

export class StateMachine extends EventEmitter {
  constructor(initialAgents) {
    super();
    const agents = initialAgents || agentLoader.getAllAgents();
    this.states = new Map();

    this.validTransitions = {
      idle: ['working', 'done', 'on_break', 'blocked'],
      working: ['debugging', 'blocked', 'on_break', 'done', 'idle'],
      debugging: ['working', 'done', 'idle'],
      blocked: ['working', 'idle', 'on_break'],
      on_break: ['working', 'idle', 'blocked'],
      done: ['idle', 'working'],
    };

    agents.forEach((agent) => {
      this.states.set(agent.id, {
        agentId: agent.id,
        name: agent.name,
        role: agent.role,
        status: agent.status || 'idle',
        currentTask: null,
        stats: {
          tasksCompleted: 0,
          breaksTaken: 0,
          tokensUsed: 0,
        },
      });
    });
  }

  transition(agentId, newStatus, meta = {}) {
    const state = this.states.get(agentId);
    if (!state) {
      console.error(`[StateMachine] Unknown agent ID: ${agentId}`);
      return false;
    }

    const currentStatus = state.status;
    if (currentStatus === newStatus) {
      if (meta.currentTask !== undefined) state.currentTask = meta.currentTask;
      if (meta.tokensUsed) state.stats.tokensUsed += meta.tokensUsed;
      return true;
    }

    const allowed = this.validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      console.error(
        `[StateMachine] Invalid transition for ${agentId}: ${currentStatus} -> ${newStatus}`
      );
      return false;
    }

    state.status = newStatus;
    if (meta.currentTask !== undefined) state.currentTask = meta.currentTask;
    if (meta.tokensUsed) state.stats.tokensUsed += meta.tokensUsed;

    if (newStatus === 'done') {
      state.stats.tasksCompleted += 1;
    } else if (newStatus === 'on_break') {
      state.stats.breaksTaken += 1;
    }

    console.log(`[Status Change] ${agentId}: ${currentStatus} -> ${newStatus}`);
    this.emit('agent:transition', { agentId, from: currentStatus, to: newStatus, state });
    return true;
  }

  setAgentStatus(agentId, newStatus, meta = {}) {
    return this.transition(agentId, newStatus, meta);
  }

  getAgentStatus(agentId) {
    return this.states.get(agentId)?.status;
  }

  getState(agentId) {
    return this.states.get(agentId);
  }

  getAllStates() {
    return Array.from(this.states.values());
  }
}

export const stateMachine = new StateMachine();
