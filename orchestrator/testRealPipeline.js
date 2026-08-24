import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipelineManager } from './pipeline.js';
import { stateMachine } from './stateMachine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testRealExecution() {
  console.log('\n===============================================================');
  console.log('       TESTING REAL LLM API EXECUTION (Milestone 3 Proof)      ');
  console.log('===============================================================\n');

  const testBrief = 'Build a modern responsive landing page for an artisanal coffee roastery named ROAST.';

  // Run pipeline in REAL mode (isMock = false)
  const result = await pipelineManager.runPipeline(testBrief, false);

  console.log('\n--- [Pipeline Real Run Result] ---');
  console.log('Generated Files:', result.filesGenerated);
  console.log('\n--- [Final Agent State Machine Summary with Real Token Counts] ---');
  const summary = stateMachine.getAllStates().map((s) => ({
    Agent: s.agentId,
    Role: s.name,
    Status: s.status,
    TokensUsed: s.stats.tokensUsed,
  }));
  console.table(summary);
}

testRealExecution().catch((err) => {
  console.error('Real execution test error:', err);
  process.exit(1);
});
