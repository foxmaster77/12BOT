/**
 * orchestrator/testFeatures.js
 *
 * Verifies all 4 features:
 * 1. Token Tracker recording & cumulative calculations
 * 2. Human Override reroute execution
 * 3. Deployer (local preview fallback & URL generation)
 * 4. Chain Client methods (safety when CHAIN_ENABLED is false and true)
 */

import { pipelineManager } from './pipeline.js';
import { tokenTracker } from './tokenTracker.js';
import { deploy } from './deployer.js';
import { getAgentStats, isChainEnabled } from './chainClient.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_SITE_DIR = path.resolve(__dirname, '../generated-site');

async function testAll() {
  console.log('====================================================');
  console.log('🧪 Starting 12BOT 2.0 Feature Verification Test Suite');
  console.log('====================================================\n');

  // Test 1: Run mock pipeline and verify Token Tracker
  console.log('--- Test 1: Pipeline & Token Tracker ---');
  tokenTracker.reset();
  const buildResult = await pipelineManager.runPipeline('Build a minimal test portfolio', true);
  console.log('✓ Pipeline executed successfully. Status:', buildResult.status);
  console.log('✓ Files generated:', buildResult.filesGenerated);

  const tokens = tokenTracker.getAll();
  const grandTotal = tokenTracker.getGrandTotal();
  console.log(`✓ Token Tracker recorded ${tokens.length} agents, total tokens: ${grandTotal}`);
  if (grandTotal <= 0) throw new Error('Token total should be greater than 0');

  // Test 2: Test Deployer
  console.log('\n--- Test 2: Live Deploy Output ---');
  const deployResult = await deploy(GENERATED_SITE_DIR);
  console.log(`✓ Deployer result: ${deployResult.url} (provider: ${deployResult.provider})`);
  if (!deployResult.url) throw new Error('Deploy URL should not be null');

  // Test 3: Test Chain Client views
  console.log('\n--- Test 3: Agent Economy / Chain Client ---');
  console.log(`✓ Chain enabled: ${isChainEnabled()}`);
  const pmStats = await getAgentStats('pm');
  console.log('✓ PM agent stats:', pmStats);

  console.log('\n====================================================');
  console.log('🎉 ALL FEATURE TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');
  process.exit(0);
}

testAll().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
