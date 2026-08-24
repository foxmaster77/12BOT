import { EventEmitter } from 'events';

/**
 * Task Queue supporting in-memory queuing (v1) and DAG dependency resolution.
 */
export class TaskQueue extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map(); // taskId -> Task
    this.completedTasks = new Set();
  }

  /**
   * Add a task to the queue
   * @param {object} task
   * @param {string} task.id - Unique task ID
   * @param {string} task.role - Assigned agent role (e.g. 'html_dev')
   * @param {string} task.title - Task title / description
   * @param {string[]} [task.dependsOn] - Array of task IDs this task depends on
   * @param {object} [task.payload] - Additional task parameters
   */
  enqueue(task) {
    const taskObj = {
      id: task.id,
      role: task.role,
      title: task.title,
      dependsOn: task.dependsOn || [],
      payload: task.payload || {},
      status: 'pending', // 'pending' | 'ready' | 'running' | 'completed' | 'failed'
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };

    this.tasks.set(task.id, taskObj);
    this.emit('task:enqueued', taskObj);
    this.updateReadyTasks();
    return taskObj;
  }

  /**
   * Check dependencies and update pending tasks to ready
   */
  updateReadyTasks() {
    for (const task of this.tasks.values()) {
      if (task.status === 'pending') {
        const allDepsSatisfied = task.dependsOn.every((depId) => this.completedTasks.has(depId));
        if (allDepsSatisfied) {
          task.status = 'ready';
          this.emit('task:ready', task);
        }
      }
    }
  }

  /**
   * Get all ready tasks for a specific role or all roles
   */
  getReadyTasks(role = null) {
    this.updateReadyTasks();
    const ready = [];
    for (const task of this.tasks.values()) {
      if (task.status === 'ready') {
        if (!role || task.role === role) {
          ready.push(task);
        }
      }
    }
    return ready;
  }

  /**
   * Claim and start a task
   */
  claimTask(taskId, agentId) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (task.status !== 'ready') {
      throw new Error(`Task ${taskId} is not in ready state (current: ${task.status})`);
    }

    task.status = 'running';
    task.assignedAgentId = agentId;
    task.startedAt = new Date().toISOString();
    this.emit('task:started', task);
    return task;
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId, result = {}) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = 'completed';
    task.result = result;
    task.completedAt = new Date().toISOString();
    this.completedTasks.add(taskId);

    this.emit('task:completed', task);
    this.updateReadyTasks();
    return task;
  }

  /**
   * Mark task as failed
   */
  failTask(taskId, error) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = 'failed';
    task.error = error.message || error;
    this.emit('task:failed', task);
    return task;
  }

  isPipelineComplete() {
    if (this.tasks.size === 0) return false;
    for (const task of this.tasks.values()) {
      if (task.status !== 'completed') return false;
    }
    return true;
  }

  clear() {
    this.tasks.clear();
    this.completedTasks.clear();
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }
}

export const taskQueue = new TaskQueue();
