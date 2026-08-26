/**
 * scripts/generateWallets.js
 *
 * Generates one Ethereum wallet per agent (plus a deployer wallet) and safely
 * appends them to the root .env file. Existing keys are NEVER overwritten.
 *
 * Usage:
 *   node scripts/generateWallets.js          # writes to .env
 *   node scripts/generateWallets.js --dry-run # prints to stdout only
 */

import { Wallet } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');

const AGENT_IDS = [
  'pm',
  'idea',
  'designer',
  'html_dev',
  'css_dev',
  'js_dev',
  'animation_dev',
  'backend_dev',
  'db_dev',
  'debugger_1',
  'debugger_2',
  'docs_writer',
];

const isDryRun = process.argv.includes('--dry-run');

// Read existing .env to avoid overwriting existing keys
let existingEnv = '';
if (fs.existsSync(ENV_FILE)) {
  existingEnv = fs.readFileSync(ENV_FILE, 'utf8');
}

function alreadySet(key) {
  // Matches KEY=<non-empty value>
  return new RegExp(`^${key}=.+`, 'm').test(existingEnv);
}

const lines = ['\n# === Generated Agent Wallets (by scripts/generateWallets.js) ==='];
let generated = 0;
let skipped = 0;

// Deployer wallet
const deployerKey = 'DEPLOYER_PRIVATE_KEY';
if (!alreadySet(deployerKey)) {
  const wallet = Wallet.createRandom();
  lines.push(`${deployerKey}=${wallet.privateKey}`);
  lines.push(`DEPLOYER_ADDRESS=${wallet.address}`);
  console.log(`[+] Generated deployer wallet: ${wallet.address}`);
  console.log(`    ⚠  Fund this address on Base Sepolia before deploying the contract.`);
  console.log(`    Faucet: https://faucet.quicknode.com/base/sepolia`);
  generated++;
} else {
  console.log(`[=] DEPLOYER_PRIVATE_KEY already set — skipping.`);
  skipped++;
}

// Per-agent wallets
for (const agentId of AGENT_IDS) {
  const keyVar = `AGENT_WALLET_PRIVATE_KEY_${agentId}`;
  const addrVar = `AGENT_WALLET_ADDRESS_${agentId}`;

  if (!alreadySet(keyVar)) {
    const wallet = Wallet.createRandom();
    lines.push(`${keyVar}=${wallet.privateKey}`);
    lines.push(`${addrVar}=${wallet.address}`);
    console.log(`[+] Generated wallet for agent "${agentId}": ${wallet.address}`);
    generated++;
  } else {
    console.log(`[=] Wallet for "${agentId}" already set — skipping.`);
    skipped++;
  }
}

console.log(`\nSummary: ${generated} generated, ${skipped} skipped.`);

if (isDryRun) {
  console.log('\n--- DRY RUN OUTPUT (not written to .env) ---');
  console.log(lines.join('\n'));
} else {
  if (lines.length > 1) {
    fs.appendFileSync(ENV_FILE, lines.join('\n') + '\n', 'utf8');
    console.log(`\n✅ Appended ${generated} wallet(s) to ${ENV_FILE}`);
  } else {
    console.log('\nNothing new to write.');
  }
}
