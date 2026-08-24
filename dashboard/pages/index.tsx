import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SitePreview from '../components/SitePreview';
import { createOfficeWs, AgentEvent, AgentStatus } from '../lib/wsClient';

// Dynamically import PixiJS canvas to prevent SSR errors
const OfficeCanvas = dynamic(() => import('../components/OfficeCanvas'), { ssr: false });

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [brief, setBrief] = useState('Build a high-end dark-themed portfolio site for a wildlife photographer named LUMEN.');
  const [isBuilding, setIsBuilding] = useState(false);
  const [refreshPreview, setRefreshPreview] = useState(0);
  const [agentLogs, setAgentLogs] = useState<AgentEvent[]>([]);
  const [agentStates, setAgentStates] = useState<Record<string, { status: AgentStatus; currentTask?: string }>>({});

  useEffect(() => {
    const ws = createOfficeWs(
      'ws://localhost:4001',
      (data) => {
        if (data.type === 'initial_state') {
          const map: Record<string, { status: AgentStatus; currentTask?: string }> = {};
          data.agents.forEach((a: any) => {
            map[a.agentId] = { status: a.status, currentTask: a.currentTask };
          });
          setAgentStates(map);
        } else if (data.type === 'agent_status') {
          setAgentStates((prev) => ({
            ...prev,
            [data.agentId]: { status: data.status, currentTask: data.currentTask },
          }));
          setAgentLogs((prev) => [data, ...prev.slice(0, 30)]);
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
        body: JSON.stringify({ brief, isMock: true }),
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
      <header style={{ padding: '1rem 2rem', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '1px' }}>
            🏢 THE OFFICE <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 400, marginLeft: '8px' }}>12-Agent AI Dev Team</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444' }} />
            <span>{connected ? 'WS Connected (ws://localhost:4001)' : 'WS Disconnected'}</span>
          </div>
        </div>
      </header>

      {/* Control Prompt Bar */}
      <div style={{ padding: '1rem 2rem', background: '#131c31', borderBottom: '1px solid #1e293b', display: 'flex', gap: '12px' }}>
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
          }}
        >
          {isBuilding ? 'Building Site...' : '🚀 Build Website'}
        </button>
      </div>

      {/* Main Dual-Panel Workspace */}
      <main style={{ display: 'grid', gridTemplateColumns: '920px 1fr', gap: '20px', padding: '20px', height: 'calc(100vh - 150px)' }}>
        {/* Left Panel: 2D Office Canvas + Status Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#0f172a', padding: '12px', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>LIVE 2D OFFICE FLOOR (12 AGENT DESKS)</span>
            </div>
            <OfficeCanvas wsUrl="ws://localhost:4001" />
          </div>

          {/* Real-time Activity Log */}
          <div style={{ flex: 1, background: '#0f172a', borderRadius: '12px', padding: '12px', border: '1px solid #1e293b', overflowY: 'auto', maxHeight: '220px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>ORCHESTRATOR EVENT STREAM</div>
            {agentLogs.length === 0 ? (
              <div style={{ color: '#475569', fontSize: '13px' }}>Waiting for agent events...</div>
            ) : (
              agentLogs.map((log, i) => (
                <div key={i} style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontFamily: 'monospace' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                  </span>
                  <span style={{ fontWeight: 700, color: '#f1f5f9' }}>[{log.agentId}]</span>
                  <span style={{ background: getStatusColor(log.status), color: '#000', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                    {log.status}
                  </span>
                  <span style={{ color: '#94a3b8' }}>{log.currentTask}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Live Output Preview */}
        <div style={{ height: '100%' }}>
          <SitePreview previewUrl="http://localhost:4000/preview/index.html" refreshTrigger={refreshPreview} />
        </div>
      </main>
    </div>
  );
}
