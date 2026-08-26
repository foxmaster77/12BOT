/**
 * orchestrator/chainClient.js
 *
 * ethers.js v6 client for the AgentEscrow contract on Base Sepolia.
 * ALL exports are no-ops when CHAIN_ENABLED !== 'true' so the rest of
 * the system runs identically without any wallet/chain config.
 *
 * Base Sepolia details:
 *   RPC  : https://sepolia.base.org  (or set BASE_SEPOLIA_RPC_URL)
 *   Chain: 84532
 *   Explorer: https://sepolia.basescan.org
 */

import { ethers } from 'ethers';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CHAIN_ENABLED = process.env.CHAIN_ENABLED === 'true';

// Agent IDs matching agents.config.json
const AGENT_IDS = [
  'pm', 'idea', 'designer', 'html_dev', 'css_dev', 'js_dev',
  'animation_dev', 'backend_dev', 'db_dev', 'debugger_1', 'debugger_2', 'docs_writer',
];

// Minimal ABI — only the functions we call from the orchestrator
const ESCROW_ABI = [
  'function depositEscrow(string agentId) external payable',
  'function releasePayment(string agentId) external',
  'function reroutePayment(string fromAgentId, string toAgentId) external',
  'function getAgent(string agentId) external view returns (tuple(uint256 escrowed, uint256 reputationScore, uint256 tasksCompleted, uint256 tasksRerouted))',
  'function wallets(string) external view returns (address)',
  'event EscrowDeposited(string agentId, uint256 amount)',
  'event PaymentReleased(string agentId, uint256 amount)',
  'event PaymentRerouted(string fromAgentId, string toAgentId, uint256 amount)',
];

/** Lazy-initialized singletons */
let _provider = null;
let _signer = null;
let _contract = null;

function getContractAddress() {
  // 1. Env var takes priority (set after deployment)
  if (process.env.ESCROW_CONTRACT_ADDRESS) {
    return process.env.ESCROW_CONTRACT_ADDRESS;
  }
  // 2. Fallback: read from contracts/deployed.json (written by deploy script)
  const deployedPath = path.join(ROOT, 'contracts', 'deployed.json');
  if (fs.existsSync(deployedPath)) {
    const data = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
    return data.AgentEscrow;
  }
  return null;
}

function getClient() {
  if (_contract) return { provider: _provider, signer: _signer, contract: _contract };

  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  const contractAddress = getContractAddress();

  if (!deployerKey) throw new Error('[ChainClient] DEPLOYER_PRIVATE_KEY not set in .env');
  if (!contractAddress) throw new Error('[ChainClient] ESCROW_CONTRACT_ADDRESS not set (run contracts:deploy first)');

  _provider = new ethers.JsonRpcProvider(rpcUrl);
  _signer = new ethers.Wallet(deployerKey, _provider);
  _contract = new ethers.Contract(contractAddress, ESCROW_ABI, _signer);

  console.log(`[ChainClient] Connected to AgentEscrow @ ${contractAddress} on Base Sepolia`);
  return { provider: _provider, signer: _signer, contract: _contract };
}

// ──────────────────────────────────────────────────────────────────────────────
// Write operations (owner-only on-chain calls)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Deposit wei into escrow for an agent when a task is assigned.
 * @param {string} agentId
 * @param {bigint|string|number} amountWei
 */
export async function depositEscrow(agentId, amountWei) {
  if (!CHAIN_ENABLED) return;
  try {
    const { contract } = getClient();
    const tx = await contract.depositEscrow(agentId, { value: BigInt(amountWei) });
    await tx.wait();
    console.log(`[ChainClient] Deposited ${amountWei} wei for agent "${agentId}" (tx: ${tx.hash})`);
  } catch (err) {
    console.error(`[ChainClient] depositEscrow failed for ${agentId}:`, err.message);
  }
}

/**
 * Release escrowed payment to agent's wallet after successful task.
 * @param {string} agentId
 */
export async function releasePayment(agentId) {
  if (!CHAIN_ENABLED) return;
  try {
    const { contract } = getClient();
    const tx = await contract.releasePayment(agentId);
    await tx.wait();
    console.log(`[ChainClient] Payment released for agent "${agentId}" (tx: ${tx.hash})`);
  } catch (err) {
    console.error(`[ChainClient] releasePayment failed for ${agentId}:`, err.message);
  }
}

/**
 * Reroute escrowed payment from a failed agent to the agent taking over.
 * @param {string} fromAgentId
 * @param {string} toAgentId
 */
export async function reroutePayment(fromAgentId, toAgentId) {
  if (!CHAIN_ENABLED) return;
  try {
    const { contract } = getClient();
    const tx = await contract.reroutePayment(fromAgentId, toAgentId);
    await tx.wait();
    console.log(`[ChainClient] Payment rerouted: ${fromAgentId} → ${toAgentId} (tx: ${tx.hash})`);
  } catch (err) {
    console.error(`[ChainClient] reroutePayment failed ${fromAgentId}→${toAgentId}:`, err.message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Read operations (view calls, no gas)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get on-chain stats for a single agent.
 * @param {string} agentId
 * @returns {Promise<{ agentId, escrowed: string, reputationScore: number, tasksCompleted: number, tasksRerouted: number, walletAddress: string }>}
 */
export async function getAgentStats(agentId) {
  if (!CHAIN_ENABLED) {
    return {
      agentId,
      escrowed: '0',
      reputationScore: 0,
      tasksCompleted: 0,
      tasksRerouted: 0,
      walletAddress: process.env[`AGENT_WALLET_ADDRESS_${agentId}`] || null,
    };
  }

  try {
    const { contract } = getClient();
    const [rec, walletAddr] = await Promise.all([
      contract.getAgent(agentId),
      contract.wallets(agentId),
    ]);

    return {
      agentId,
      escrowed: rec.escrowed.toString(),
      reputationScore: Number(rec.reputationScore),
      tasksCompleted: Number(rec.tasksCompleted),
      tasksRerouted: Number(rec.tasksRerouted),
      walletAddress: walletAddr,
    };
  } catch (err) {
    console.error(`[ChainClient] getAgentStats failed for ${agentId}:`, err.message);
    return {
      agentId,
      escrowed: '0',
      reputationScore: 0,
      tasksCompleted: 0,
      tasksRerouted: 0,
      walletAddress: process.env[`AGENT_WALLET_ADDRESS_${agentId}`] || null,
      error: err.message,
    };
  }
}

/**
 * Get on-chain stats for all 12 agents in parallel.
 * @returns {Promise<Array>}
 */
export async function getAllAgentStats() {
  return Promise.all(AGENT_IDS.map((id) => getAgentStats(id)));
}

/**
 * Returns true if chain features are enabled.
 */
export function isChainEnabled() {
  return CHAIN_ENABLED;
}
