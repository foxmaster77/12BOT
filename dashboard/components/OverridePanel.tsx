/**
 * dashboard/components/OverridePanel.tsx
 *
 * Human Override Control — lets a human manually reassign an in-progress
 * task from one agent to another by calling POST /api/reroute.
 * Triggers the same fallback/reroute logic as quota-exhaustion.
 */

import React, { useState, useMemo } from 'react';

type AgentStatus = 'idle' | 'working' | 'debugging' | 'on_break' | 'blocked' | 'done';

interface OverridePanelProps {
  agentStates: Record<string, { status: AgentStatus; currentTask?: string }>;
}

const AGENT_IDS = [
  'pm', 'idea', 'designer', 'html_dev', 'css_dev', 'js_dev',
  'animation_dev', 'backend_dev', 'db_dev', 'debugger_1', 'debugger_2', 'docs_writer',
];

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  pm: 'PM / Brain',
  idea: 'Idea Gen',
  designer: 'UI/UX Designer',
  html_dev: 'HTML Dev',
  css_dev: 'CSS Dev',
  js_dev: 'JS Dev',
  animation_dev: 'Anim Dev',
  backend_dev: 'Backend Dev',
  db_dev: 'DB Setup',
  debugger_1: 'Frontend QA',
  debugger_2: 'System QA',
  docs_writer: 'Docs Writer',
};

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let _toastId = 0;

export default function OverridePanel({ agentStates }: OverridePanelProps) {
  const [fromAgent, setFromAgent] = useState('');
  const [toAgent, setToAgent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Agents that have an active task (valid "from" targets)
  const activeAgents = useMemo(() =>
    AGENT_IDS.filter((id) => {
      const status = agentStates[id]?.status;
      return status === 'working' || status === 'debugging';
    }),
    [agentStates]
  );

  // Agents that are available to pick up the task (valid "to" targets)
  const availableAgents = useMemo(() =>
    AGENT_IDS.filter((id) => {
      const status = agentStates[id]?.status;
      return (status === 'idle' || status === 'done') && id !== fromAgent;
    }),
    [agentStates, fromAgent]
  );

  function addToast(type: ToastType, message: string) {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  async function handleReroute() {
    if (!fromAgent || !toAgent) {
      addToast('error', 'Select both a source and target agent.');
      return;
    }
    if (fromAgent === toAgent) {
      addToast('error', 'Source and target agent must be different.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/reroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAgentId: fromAgent, toAgentId: toAgent }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      addToast(
        'success',
        `✓ Task reassigned: ${AGENT_DISPLAY_NAMES[fromAgent]} → ${AGENT_DISPLAY_NAMES[toAgent]}`
      );

      // Reset selects
      setFromAgent('');
      setToAgent('');
    } catch (err: any) {
      addToast('error', `Reroute failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const toastColors: Record<ToastType, { bg: string; border: string; color: string }> = {
    success: { bg: '#052e16', border: '#166534', color: '#4ade80' },
    error: { bg: '#2d0a0a', border: '#7f1d1d', color: '#f87171' },
    info: { bg: '#0c2030', border: '#1e40af', color: '#60a5fa' },
  };

  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: '12px',
        padding: '12px 16px',
        border: '1px solid #1e293b',
        fontSize: '12px',
        color: '#f8fafc',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ fontWeight: 700, fontSize: '11px', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '10px' }}>
        HUMAN OVERRIDE — TASK REASSIGNMENT
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* From agent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '140px' }}>
          <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>FROM (active agent)</label>
          <select
            value={fromAgent}
            onChange={(e) => { setFromAgent(e.target.value); setToAgent(''); }}
            style={{
              background: '#0a0f1d',
              border: `1px solid ${fromAgent ? '#f97316' : '#334155'}`,
              borderRadius: '6px',
              color: fromAgent ? '#f97316' : '#94a3b8',
              padding: '6px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">— select agent —</option>
            {activeAgents.length === 0 && (
              <option disabled value="">No active agents</option>
            )}
            {activeAgents.map((id) => (
              <option key={id} value={id}>
                {AGENT_DISPLAY_NAMES[id]} ({agentStates[id]?.status})
              </option>
            ))}
          </select>
        </div>

        {/* Arrow */}
        <span style={{ color: '#475569', fontSize: '18px', marginTop: '16px' }}>→</span>

        {/* To agent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '140px' }}>
          <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>TO (available agent)</label>
          <select
            value={toAgent}
            onChange={(e) => setToAgent(e.target.value)}
            disabled={!fromAgent}
            style={{
              background: '#0a0f1d',
              border: `1px solid ${toAgent ? '#22c55e' : '#334155'}`,
              borderRadius: '6px',
              color: toAgent ? '#22c55e' : '#94a3b8',
              padding: '6px 8px',
              fontSize: '12px',
              cursor: fromAgent ? 'pointer' : 'not-allowed',
              outline: 'none',
              opacity: fromAgent ? 1 : 0.5,
            }}
          >
            <option value="">— select agent —</option>
            {availableAgents.map((id) => (
              <option key={id} value={id}>
                {AGENT_DISPLAY_NAMES[id]}
              </option>
            ))}
          </select>
        </div>

        {/* Reassign button */}
        <button
          onClick={handleReroute}
          disabled={!fromAgent || !toAgent || isSubmitting}
          style={{
            marginTop: '16px',
            padding: '7px 16px',
            background: fromAgent && toAgent && !isSubmitting ? '#f97316' : '#1e293b',
            color: fromAgent && toAgent && !isSubmitting ? '#fff' : '#475569',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '12px',
            cursor: fromAgent && toAgent && !isSubmitting ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {isSubmitting ? '⏳ Rerouting...' : '⚡ Reassign Task'}
        </button>
      </div>

      {/* Active task preview */}
      {fromAgent && agentStates[fromAgent]?.currentTask && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px 10px',
            background: '#1a0f00',
            border: '1px solid #431407',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#fb923c',
          }}
        >
          <span style={{ color: '#64748b' }}>Active task: </span>
          {agentStates[fromAgent].currentTask}
        </div>
      )}

      {/* Toast notifications */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: 50,
        }}
      >
        {toasts.map((toast) => {
          const colors = toastColors[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                padding: '8px 12px',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.color,
                fontSize: '12px',
                fontWeight: 600,
                animation: 'fadeInUp 0.2s ease',
              }}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </div>
  );
}
