/**
 * contracts/scripts/deploy.js
 *
 * Deploys AgentEscrow to Base Sepolia (or local Hardhat node).
 * After deployment, reads all 12 agent wallet addresses from the root .env
 * and calls registerWallet() for each.
 * Saves the deployed contract address to contracts/deployed.json.
 *
 * Usage:
 *   npm run deploy:baseSepolia   (from contracts/ directory)
 *   npm run contracts:deploy     (from project root)
 */

import hre from 'hardhat';
import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const AGENT_IDS = [
  'pm', 'idea', 'designer', 'html_dev', 'css_dev', 'js_dev',
  'animation_dev', 'backend_dev', 'db_dev', 'debugger_1', 'debugger_2', 'docs_writer',
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n[Deploy] Deployer account: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`[Deploy] Deployer balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error('\n⚠  Deployer wallet has 0 ETH. Get testnet ETH first:');
    console.error('   https://faucet.quicknode.com/base/sepolia');
    process.exit(1);
  }

  // ── Deploy contract ──────────────────────────────────────────────────────
  console.log('\n[Deploy] Deploying AgentEscrow...');
  const AgentEscrow = await ethers.getContractFactory('AgentEscrow');
  const contract = await AgentEscrow.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`[Deploy] AgentEscrow deployed at: ${contractAddress}`);

  // ── Register agent wallets ───────────────────────────────────────────────
  console.log('\n[Deploy] Registering agent wallets...');
  let registered = 0;

  for (const agentId of AGENT_IDS) {
    const walletAddr = process.env[`AGENT_WALLET_ADDRESS_${agentId}`];
    if (!walletAddr) {
      console.warn(`  ⚠  No wallet address found for agent "${agentId}" — skipping.`);
      console.warn(`     Run: npm run generate:wallets  (from project root)`);
      continue;
    }
    const tx = await contract.registerWallet(agentId, walletAddr);
    await tx.wait();
    console.log(`  ✓  Registered "${agentId}" → ${walletAddr}`);
    registered++;
  }

  console.log(`\n[Deploy] Registered ${registered}/${AGENT_IDS.length} agent wallets.`);

  // ── Save deployed address ────────────────────────────────────────────────
  const deployedPath = path.join(__dirname, '..', 'deployed.json');
  const deployedData = {
    AgentEscrow: contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };
  fs.writeFileSync(deployedPath, JSON.stringify(deployedData, null, 2));
  console.log(`\n[Deploy] Contract address saved to: contracts/deployed.json`);

  // ── Next steps hint ──────────────────────────────────────────────────────
  console.log('\n=== NEXT STEPS ===');
  console.log(`1. Add to your .env:  ESCROW_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`2. Add to your .env:  CHAIN_ENABLED=true`);
  console.log(`3. Fund the contract with a small amount of ETH for escrow deposits:`);
  console.log(`   cast send ${contractAddress} --value 0.001ether --private-key $DEPLOYER_PRIVATE_KEY --rpc-url ${process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'}`);
  console.log(`4. View on explorer: https://sepolia.basescan.org/address/${contractAddress}`);
  console.log('==================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
