/**
 * dashboard/components/EconomyPanel.tsx
 *
 * Agent Economy panel — shows on-chain wallet balances, reputation scores,
 * and task stats for all 12 agents. Updates live from `economy_update` WS events.
 * Links to Blockscout/Basescan explorer for each wallet.
 */

import React from 'react';

interface AgentEconomyData {
  agentId: string;
  escrowed: string;      // wei as string
  reputationScore: number;
  tasksCompleted: number;
  tasksRerouted: number;
  walletAddress: string | null;
  error?: string;
}

interface EconomyPanelProps {
  agentEconomy: Record<string, AgentEconomyData>;
  chainEnabled: boolean;
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
const EXPLORER_BASE = 'https://sepolia.basescan.org/address/';

function truncateAddr(addr: string | null): string {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function weiToEthDisplay(wei: string): string {
  try {
    const n = BigInt(wei || '0');
    if (n === BigInt(0)) return '0';
    // Show in gwei for small amounts (symbolic escrow)
    if (n < BigInt('1000000000000000')) {
      const gwei = Number(n) / 1e9;
      return `${gwei.toFixed(0)} gwei`;
    }
    const eth = Number(n) / 1e18;
    return `${eth.toFixed(6)} ETH`;
  } catch {
    return wei || '0';
  }
}

function reputationStars(score: number): string {
  if (score <= 0) return '—';
  const full = Math.min(score, 5);
  return '⭐'.repeat(full) + (score > 5 ? ` +${score - 5}` : '');
}

export default function EconomyPanel({ agentEconomy, chainEnabled }: EconomyPanelProps) {
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
          AGENT ECONOMY — ON-CHAIN REPUTATION
        </span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '10px',
            background: chainEnabled ? '#052e16' : '#1e1e2e',
            color: chainEnabled ? '#4ade80' : '#475569',
            border: `1px solid ${chainEnabled ? '#166534' : '#334155'}`,
          }}
        >
          {chainEnabled ? '⛓ Base Sepolia LIVE' : '⛓ Chain Disabled (CHAIN_ENABLED=false)'}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ color: '#475569', textAlign: 'left' }}>
              <th style={{ padding: '4px 8px 6px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>Agent</th>
              <th style={{ padding: '4px 8px 6px', fontWeight: 600, whiteSpace: 'nowrap' }}>Wallet</th>
              <th style={{ padding: '4px 8px 6px', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>Escrowed</th>
              <th style={{ padding: '4px 8px 6px', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>Reputation</th>
              <th style={{ padding: '4px 8px 6px', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>✓ Done</th>
              <th style={{ padding: '4px 8px 6px', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>↩ Rerouted</th>
            </tr>
          </thead>
          <tbody>
            {AGENT_IDS.map((agentId, i) => {
              const data = agentEconomy[agentId];
              let hasEscrow = false;
              try {
                hasEscrow = Boolean(data && BigInt(data.escrowed || '0') > BigInt(0));
              } catch {
                hasEscrow = false;
              }

              return (
                <tr
                  key={agentId}
                  style={{
                    borderTop: '1px solid #1e293b',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  {/* Agent name */}
                  <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                    {AGENT_DISPLAY_NAMES[agentId]}
                  </td>

                  {/* Wallet address */}
                  <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>
                    {data?.walletAddress ? (
                      <a
                        href={`${EXPLORER_BASE}${data.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#38bdf8',
                          textDecoration: 'none',
                          fontSize: '10px',
                        }}
                        title={data.walletAddress}
                      >
                        {truncateAddr(data.walletAddress)} ↗
                      </a>
                    ) : (
                      <span style={{ color: '#334155' }}>not set</span>
                    )}
                  </td>

                  {/* Escrowed */}
                  <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        color: hasEscrow ? '#fbbf24' : '#334155',
                        fontFamily: 'monospace',
                        fontWeight: hasEscrow ? 700 : 400,
                      }}
                    >
                      {data ? weiToEthDisplay(data.escrowed) : '—'}
                    </span>
                  </td>

                  {/* Reputation */}
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px' }}>
                      {data ? reputationStars(data.reputationScore) : '—'}
                    </span>
                  </td>

                  {/* Tasks Completed */}
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <span
                      style={{
                        color: data?.tasksCompleted ? '#4ade80' : '#334155',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      {data?.tasksCompleted ?? 0}
                    </span>
                  </td>

                  {/* Tasks Rerouted */}
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <span
                      style={{
                        color: data?.tasksRerouted ? '#f87171' : '#334155',
                        fontWeight: data?.tasksRerouted ? 700 : 400,
                        fontFamily: 'monospace',
                      }}
                    >
                      {data?.tasksRerouted ?? 0}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!chainEnabled && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px 10px',
            background: '#0c1524',
            borderRadius: '6px',
            color: '#475569',
            fontSize: '10px',
            lineHeight: 1.5,
          }}
        >
          Set <code style={{ color: '#94a3b8' }}>CHAIN_ENABLED=true</code> in .env and run{' '}
          <code style={{ color: '#94a3b8' }}>npm run contracts:deploy</code> to activate live on-chain tracking.
          <br />
          Faucet: <a href="https://faucet.quicknode.com/base/sepolia" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>faucet.quicknode.com/base/sepolia</a>
        </div>
      )}
    </div>
  );
}
