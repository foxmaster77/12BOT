import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SitePreview from '../components/SitePreview';
import TokenPanel from '../components/TokenPanel';
import OverridePanel from '../components/OverridePanel';
import EconomyPanel from '../components/EconomyPanel';
import { createOfficeWs, AgentEvent, AgentStatus } from '../lib/wsClient';

// Dynamically import PixiJS canvas to prevent SSR errors
const OfficeCanvas = dynamic(() => import('../components/OfficeCanvas'), { ssr: false });

interface AgentTokenData {
  agentId: string;
  delta?: number;
  cumulative: number;
  taskId?: string;
  model?: string;
  timestamp?: string;
}

interface AgentEconomyData {
  agentId: string;
  escrowed: string;
  reputationScore: number;
  tasksCompleted: number;
  tasksRerouted: number;
  walletAddress: string | null;
  error?: string;
}

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [brief, setBrief] = useState('Build a high-end dark-themed portfolio site for a wildlife photographer named LUMEN.');
  const [isBuilding, setIsBuilding] = useState(false);
  const [useMock, setUseMock] = useState(false); // Defaulting UNCHECKED (real API execution)
  const [refreshPreview, setRefreshPreview] = useState(0);
  const [agentLogs, setAgentLogs] = useState<AgentEvent[]>([]);
  const [agentStates, setAgentStates] = useState<Record<string, { status: AgentStatus; currentTask?: string }>>({});

  // Feature 1: Token Usage State
  const [agentTokens, setAgentTokens] = useState<Record<string, AgentTokenData>>({});
  const [grandTotalTokens, setGrandTotalTokens] = useState(0);

  // Feature 3: Live Deploy Output State
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [deployProvider, setDeployProvider] = useState<'vercel' | 'local' | null>(null);

  // Feature 4: Agent Economy State
  const [agentEconomy, setAgentEconomy] = useState<Record<string, AgentEconomyData>>({});
  const [chainEnabled, setChainEnabled] = useState(false);

  useEffect(() => {
    // Initial fetch for token and economy snapshots via REST
    const fetchInitialData = async () => {
      try {
        const tokenRes = await fetch('http://localhost:4000/api/tokens');
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          if (Array.isArray(tokenData.tokens)) {
            const map: Record<string, AgentTokenData> = {};
            tokenData.tokens.forEach((t: any) => {
              map[t.agentId] = { agentId: t.agentId, cumulative: t.total, taskId: '' };
            });
            setAgentTokens(map);
            setGrandTotalTokens(tokenData.grandTotal || 0);
          }
        }
      } catch (e) {
        // Orchestrator might still be starting
      }

      try {
        const econRes = await fetch('http://localhost:4000/api/economy');
        if (econRes.ok) {
          const econData = await econRes.json();
          setChainEnabled(econData.chainEnabled);
          if (Array.isArray(econData.agents)) {
            const map: Record<string, AgentEconomyData> = {};
            econData.agents.forEach((a: any) => {
              map[a.agentId] = a;
            });
            setAgentEconomy(map);
          }
        }
      } catch (e) {
        // Ignore
      }

      try {
        const deployRes = await fetch('http://localhost:4000/api/deploy-status');
        if (deployRes.ok) {
          const deployData = await deployRes.json();
          if (deployData.url) {
            setDeployUrl(deployData.url);
            setDeployProvider(deployData.provider);
          }
        }
      } catch (e) {
        // Ignore
      }
    };

    fetchInitialData();

    // WebSocket listener for live multi-agent events
    const ws = createOfficeWs(
      'ws://localhost:4001',
      (data) => {
        if (data.type === 'initial_state') {
          const map: Record<string, { status: AgentStatus; currentTask?: string }> = {};
          data.agents?.forEach((a: any) => {
            map[a.agentId] = { status: a.status, currentTask: a.currentTask };
          });
          setAgentStates(map);

          if (data.chainEnabled !== undefined) setChainEnabled(data.chainEnabled);
          if (data.deployStatus?.url) {
            setDeployUrl(data.deployStatus.url);
            setDeployProvider(data.deployStatus.provider);
          }
          if (Array.isArray(data.tokenSnapshot)) {
            const tmap: Record<string, AgentTokenData> = {};
            let total = 0;
            data.tokenSnapshot.forEach((t: any) => {
              tmap[t.agentId] = { agentId: t.agentId, cumulative: t.total, taskId: '' };
              total += t.total || 0;
            });
            setAgentTokens(tmap);
            setGrandTotalTokens(total);
          }
        } else if (data.type === 'agent_status') {
          setAgentStates((prev) => ({
            ...prev,
            [data.agentId]: { status: data.status, currentTask: data.currentTask },
          }));
          setAgentLogs((prev) => [data, ...prev.slice(0, 40)]);
        } else if (data.type === 'token_update') {
          // Feature 1: Live Token Updates
          setAgentTokens((prev) => ({
            ...prev,
            [data.agentId]: {
              agentId: data.agentId,
              delta: data.delta,
              cumulative: data.cumulative,
              taskId: data.taskId,
              timestamp: data.timestamp,
            },
          }));
          if (data.grandTotal !== undefined) {
            setGrandTotalTokens(data.grandTotal);
          }
        } else if (data.type === 'agent_rerouted') {
          // Feature 2: Human Override or Fallback Reroute notice in log
          const rerouteEvent: AgentEvent = {
            agentId: data.toAgentId,
            status: 'working',
            currentTask: `[REROUTED from ${data.fromAgentId}] Task: ${data.taskId}`,
            timestamp: data.timestamp,
          };
          setAgentLogs((prev) => [rerouteEvent, ...prev.slice(0, 40)]);
        } else if (data.type === 'deploy_ready') {
          // Feature 3: Auto-deploy URL
          setDeployUrl(data.url);
          setDeployProvider(data.provider);
          setRefreshPreview((r) => r + 1);
        } else if (data.type === 'economy_update') {
          // Feature 4: Live Agent Economy Updates
          if (Array.isArray(data.agents)) {
            const map: Record<string, AgentEconomyData> = {};
            data.agents.forEach((a: any) => {
              map[a.agentId] = a;
            });
            setAgentEconomy(map);
          }
        } else if (data.type === 'pipeline_finished') {
          setIsBuilding(false);
          setRefreshPreview((r) => r + 1);
        } else if (data.type === 'pipeline_started') {
          setIsBuilding(true);
        }
      },
      (isConnected) => setConnected(isConnected)
    );

    return () => ws.close();
  }, []);

  const handleStartBuild = async () => {
    if (!brief.trim()) return;
    setIsBuilding(true);
    try {
      await fetch('http://localhost:4000/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, isMock: useMock }),
      });
    } catch (err) {
      console.error('Failed to trigger build:', err);
      setIsBuilding(false);
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'working':
        return '#22c55e';
      case 'debugging':
        return '#eab308';
      case 'on_break':
        return '#f97316';
      case 'blocked':
        return '#ef4444';
      case 'done':
        return '#06b6d4';
      default:
        return '#64748b';
    }
  };

  return (
    <div style={{ background: '#090d16', minHeight: '100vh', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ padding: '0.8rem 2rem', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, letterSpacing: '1px' }}>
            🏢 THE OFFICE <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 400, marginLeft: '6px' }}>12-Agent AI Dev Team</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Live Deployment Banner */}
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: deployProvider === 'vercel' ? '#042f2e' : '#172554',
                color: deployProvider === 'vercel' ? '#2dd4bf' : '#60a5fa',
                border: `1px solid ${deployProvider === 'vercel' ? '#115e59' : '#1e40af'}`,
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 0 10px rgba(45,212,191,0.2)',
              }}
            >
              <span>🚀 Live Deploy ({deployProvider?.toUpperCase()}):</span>
              <span style={{ textDecoration: 'underline' }}>{deployUrl}</span> ↗
            </a>
          )}

          {/* Connection Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444' }} />
            <span style={{ color: '#94a3b8' }}>{connected ? 'Hub Connected' : 'Hub Disconnected'}</span>
          </div>
        </div>
      </header>

      {/* Control Prompt Bar */}
      <div style={{ padding: '0.8rem 2rem', background: '#131c31', borderBottom: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Enter website brief (e.g. Build a portfolio for a photographer...)"
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#0a0f1d',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleStartBuild}
            disabled={isBuilding}
            style={{
              background: isBuilding ? '#475569' : '#38bdf8',
              color: '#04101e',
              fontWeight: 700,
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: isBuilding ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              transition: 'background 0.2s',
            }}
          >
            {isBuilding ? 'Building Site...' : '🚀 Build Website'}
          </button>
        </div>

        {/* Mode Selector & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#94a3b8' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
              style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#38bdf8' }}
            />
            <span style={{ color: useMock ? '#eab308' : '#38bdf8', fontWeight: 600 }}>
              Use mock data (fast simulation)
            </span>
          </label>
          <span style={{ color: '#475569' }}>|</span>
          <span style={{ color: useMock ? '#94a3b8' : '#4ade80' }}>
            {useMock ? '⚡ Fast offline run' : '⚡ LIVE: Calling real multi-agent LLMs (Groq, Gemini, OpenRouter)'}
          </span>
        </div>
      </div>

      {/* Main Dual-Panel Workspace */}
      <main style={{ display: 'grid', gridTemplateColumns: '960px 1fr', gap: '20px', padding: '20px' }}>
        {/* Left Column: 2D Office Canvas + Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 2D Office Canvas */}
          <div style={{ background: '#0f172a', padding: '12px', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>
                LIVE 2D OFFICE FLOOR (12 AGENT DESKS)
              </span>
            </div>
            <OfficeCanvas wsUrl="ws://localhost:4001" />
          </div>

          {/* Interactive Controls & Real-Time Metrics Grid (Features 1 & 2) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Feature 1: Token / Cost Tracker Panel */}
            <TokenPanel agentTokens={agentTokens} grandTotal={grandTotalTokens} />

            {/* Feature 2: Human Override Control Panel */}
            <OverridePanel agentStates={agentStates} />
          </div>

          {/* Feature 4: Agent Economy & On-Chain Reputation Panel */}
          <EconomyPanel agentEconomy={agentEconomy} chainEnabled={chainEnabled} />

          {/* Activity Stream */}
          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '12px 16px', border: '1px solid #1e293b', overflowY: 'auto', maxHeight: '180px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '8px' }}>
              ORCHESTRATOR REAL-TIME EVENT STREAM
            </div>
            {agentLogs.length === 0 ? (
              <div style={{ color: '#475569', fontSize: '12px' }}>Waiting for agent events...</div>
            ) : (
              agentLogs.map((log, i) => (
                <div key={i} style={{ fontSize: '11px', marginBottom: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontFamily: 'monospace' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                  </span>
                  <span style={{ fontWeight: 700, color: '#f1f5f9' }}>[{log.agentId}]</span>
                  <span style={{ background: getStatusColor(log.status), color: '#000', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                    {log.status}
                  </span>
                  <span style={{ color: '#94a3b8' }}>{log.currentTask}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Output / Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '12px', border: '1px solid #1e293b', height: '100%', minHeight: '750px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>
                LIVE GENERATED WEBSITE PREVIEW
              </span>
              {deployUrl && (
                <span style={{ fontSize: '11px', color: '#38bdf8' }}>
                  Streaming from {deployProvider === 'vercel' ? 'Vercel CDN' : 'Local Preview Server'}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <SitePreview
                previewUrl={deployUrl || 'http://localhost:4000/preview/index.html'}
                refreshTrigger={refreshPreview}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
