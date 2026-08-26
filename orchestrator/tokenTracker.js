/**
 * orchestrator/tokenTracker.js
 *
 * Singleton that records token usage per agent per task.
 * Emits `tokens:updated` after every record() call so index.js
 * can broadcast the live snapshot to the dashboard.
 */

import { EventEmitter } from 'events';

export class TokenTracker extends EventEmitter {
  constructor() {
    super();
    /**
     * Map<agentId, { total: number, history: Array<{taskId, tokens, model, timestamp}> }>
     */
    this.usage = new Map();
  }

  /**
   * Record token usage for a completed agent task.
   * @param {string} agentId
   * @param {string} taskId
   * @param {number} tokensUsed
   * @param {string} [model]
   */
  record(agentId, taskId, tokensUsed = 0, model = 'unknown') {
    if (!this.usage.has(agentId)) {
      this.usage.set(agentId, { total: 0, history: [] });
    }
    const entry = this.usage.get(agentId);
    entry.total += tokensUsed;
    entry.history.push({
      taskId,
      tokens: tokensUsed,
      model,
      timestamp: new Date().toISOString(),
    });

    this.emit('tokens:updated', {
      agentId,
      delta: tokensUsed,
      cumulative: entry.total,
      taskId,
      model,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Returns all agent usage as an array for REST/WS snapshot.
   * @returns {Array<{ agentId, total, history }>}
   */
  getAll() {
    const result = [];
    for (const [agentId, data] of this.usage.entries()) {
      result.push({ agentId, total: data.total, history: data.history });
    }
    return result;
  }

  /**
   * Returns the cumulative total across all agents (useful for header stats).
   */
  getGrandTotal() {
    let total = 0;
    for (const data of this.usage.values()) {
      total += data.total;
    }
    return total;
  }

  /** Reset — called at the start of each pipeline run */
  reset() {
    this.usage.clear();
  }
}

export const tokenTracker = new TokenTracker();
