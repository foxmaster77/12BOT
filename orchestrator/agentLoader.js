import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AgentLoader {
  constructor() {
    this.configPath = path.join(__dirname, '../agents.config.json');
    this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    this.agents = this.config.agents.map((agentDef) => ({
      id: agentDef.id,
      name: agentDef.name,
      role: agentDef.role,
      api: agentDef.api,
      model: agentDef.model,
      api_key_env: agentDef.api_key_env,
      apiKeyEnv: agentDef.api_key_env,
      system_prompt: agentDef.system_prompt,
      systemPrompt: agentDef.system_prompt,
      status: 'idle',
    }));
    this.agentMap = new Map(this.agents.map((a) => [a.id, a]));
    this.fallbackPairs = this.config.fallback_pairs || {};
    this.onBreakCooldownSeconds = this.config.on_break_cooldown_seconds || 60;
  }

  getAllAgents() {
    return this.agents;
  }

  getAgent(id) {
    return this.agentMap.get(id);
  }

  getFallbackAgentId(id) {
    const fallbacks = this.fallbackPairs[id];
    return fallbacks && fallbacks.length > 0 ? fallbacks[0] : null;
  }
}

export const agentLoader = new AgentLoader();

export function loadAgents() {
  const agents = agentLoader.getAllAgents();
  console.log('Loaded 12 Agents:');
  console.log(agents);
  return {
    agents,
    fallbackPairs: agentLoader.fallbackPairs,
    onBreakCooldownSeconds: agentLoader.onBreakCooldownSeconds,
  };
}
