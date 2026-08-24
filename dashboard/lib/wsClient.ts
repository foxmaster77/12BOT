export type AgentStatus = 'idle' | 'working' | 'debugging' | 'blocked' | 'on_break' | 'done';

export interface AgentEvent {
  agentId: string;
  name?: string;
  status: AgentStatus;
  previousStatus?: AgentStatus;
  currentTask?: string;
  error?: string;
  timestamp?: string;
}

export function createOfficeWs(
  wsUrl: string = 'ws://localhost:4001',
  onMessage: (data: any) => void,
  onStatusChange?: (connected: boolean) => void
) {
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[Dashboard WS] Connected to orchestrator');
    if (onStatusChange) onStatusChange(true);
  };

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch (e) {
      console.error('[Dashboard WS] Parse error:', e);
    }
  };

  ws.onclose = () => {
    console.log('[Dashboard WS] Disconnected');
    if (onStatusChange) onStatusChange(false);
  };

  ws.onerror = (err) => {
    console.error('[Dashboard WS] Error:', err);
  };

  return ws;
}
