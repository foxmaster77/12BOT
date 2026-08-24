import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipelineManager } from './pipeline.js';
import { stateMachine } from './stateMachine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GENERATED_SITE_DIR = path.resolve(__dirname, '../generated-site');

async function testMilestone2() {
  console.log('Testing Milestone 2: Multi-Agent Task Pipeline & DAG Code Generator...');

  const sampleBrief = 'Build a high-end dark-themed portfolio site for a wildlife photographer named LUMEN.';

  const result = await pipelineManager.runPipeline(sampleBrief, true);

  console.log('Pipeline Result Summary:', result);

  // Check generated files on disk
  console.log('\n--- [Verifying Generated Files on Disk] ---');
  const expectedFiles = [
    'index.html',
    'styles.css',
    'script.js',
    'animations.js',
    'server.js',
    'schema.sql',
    'README.md',
  ];

  let allFilesPresent = true;
  for (const filename of expectedFiles) {
    const fullPath = path.join(GENERATED_SITE_DIR, filename);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`  ✓ ${filename.padEnd(16)} exists (${stats.size} bytes)`);
    } else {
      console.error(`  ✗ ${filename.padEnd(16)} MISSING!`);
      allFilesPresent = false;
    }
  }

  if (!allFilesPresent) {
    throw new Error('Not all expected files were generated on disk!');
  }

  // Print summary of agent final states
  console.log('\n--- [Final Agent State Machine Status] ---');
  const summary = stateMachine.getAllStates().map((s) => ({
    Agent: s.agentId,
    Role: s.name,
    Status: s.status,
    TasksDone: s.stats.tasksCompleted,
    TokensUsed: s.stats.tokensUsed,
  }));
  console.table(summary);
}

testMilestone2().catch((err) => {
  console.error('Milestone 2 test failed:', err);
  process.exit(1);
});
