/**
 * dashboard/components/TokenPanel.tsx
 *
 * Live token usage panel for the 12-agent dashboard.
 * Receives `agentTokens` state from parent (index.tsx) which is
 * updated on every `token_update` WebSocket event.
 */

import React, { useMemo } from 'react';

interface AgentTokenData {
  agentId: string;
  delta?: number;
  cumulative: number;
  taskId?: string;
  model?: string;
  timestamp?: string;
}

interface TokenPanelProps {
  /** Map of agentId → latest token snapshot */
  agentTokens: Record<string, AgentTokenData>;
  /** Grand total tokens across all agents */
  grandTotal: number;
}

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  pm: 'PM / Brain',
  idea: 'Idea Gen',
  designer: 'UI/UX',
  html_dev: 'HTML Dev',
  css_dev: 'CSS Dev',
  js_dev: 'JS Dev',
  animation_dev: 'Anim Dev',
  backend_dev: 'Backend',
  db_dev: 'DB Setup',
  debugger_1: 'Frontend QA',
  debugger_2: 'System QA',
  docs_writer: 'Docs Writer',
};

const AGENT_IDS = Object.keys(AGENT_DISPLAY_NAMES);

// Color gradient: dim → bright cyan as usage increases
function getBarColor(pct: number): string {
  if (pct === 0) return '#1e293b';
  if (pct < 0.25) return '#0c4a6e';
  if (pct < 0.5) return '#0369a1';
  if (pct < 0.75) return '#0ea5e9';
  return '#38bdf8';
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

export default function TokenPanel({ agentTokens, grandTotal }: TokenPanelProps) {
  const maxTokens = useMemo(() => {
    return Math.max(
      1,
      ...AGENT_IDS.map((id) => agentTokens[id]?.cumulative ?? 0)
    );
  }, [agentTokens]);

  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: '12px',
        padding: '12px 16px',
        border: '1px solid #1e293b',
        fontSize: '12px',
        color: '#f8fafc',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '11px', color: '#94a3b8', letterSpacing: '0.5px' }}>
          TOKEN USAGE (CUMULATIVE)
        </span>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#38bdf8',
            fontWeight: 700,
          }}
        >
          Σ {formatTokens(grandTotal)}
        </span>
      </div>

      {/* Agent rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {AGENT_IDS.map((agentId) => {
          const data = agentTokens[agentId];
          const tokens = data?.cumulative ?? 0;
          const pct = maxTokens > 0 ? tokens / maxTokens : 0;
          const pctOfTotal = grandTotal > 0 ? (tokens / grandTotal) * 100 : 0;

          return (
            <div key={agentId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Agent name */}
              <span
                style={{
                  width: '74px',
                  flexShrink: 0,
                  color: tokens > 0 ? '#e2e8f0' : '#475569',
                  fontSize: '11px',
                  fontWeight: tokens > 0 ? 600 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {AGENT_DISPLAY_NAMES[agentId]}
              </span>

              {/* Bar */}
              <div
                style={{
                  flex: 1,
                  height: '10px',
                  background: '#1e293b',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, pct * 100)}%`,
                    height: '100%',
                    background: getBarColor(pct),
                    borderRadius: '5px',
                    transition: 'width 0.4s ease, background 0.4s ease',
                    boxShadow: pct > 0.5 ? '0 0 6px rgba(56,189,248,0.4)' : 'none',
                  }}
                />
              </div>

              {/* Token count */}
              <span
                style={{
                  width: '36px',
                  textAlign: 'right',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: tokens > 0 ? '#38bdf8' : '#334155',
                  fontWeight: 600,
                }}
              >
                {formatTokens(tokens)}
              </span>

              {/* % of total */}
              <span
                style={{
                  width: '30px',
                  textAlign: 'right',
                  fontSize: '10px',
                  color: '#475569',
                }}
              >
                {pctOfTotal > 0 ? `${pctOfTotal.toFixed(0)}%` : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      {grandTotal === 0 && (
        <div
          style={{
            marginTop: '8px',
            color: '#334155',
            fontSize: '11px',
            textAlign: 'center',
          }}
        >
          Token usage will appear live during pipeline execution.
        </div>
      )}
    </div>
  );
}
