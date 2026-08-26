/**
 * contracts/test/AgentEscrow.test.js
 *
 * Hardhat + Chai tests for AgentEscrow.sol
 * Run: cd contracts && npx hardhat test
 */

import { expect } from 'chai';
import hre from 'hardhat';

describe('AgentEscrow', function () {
  let ethers;
  let contract;
  let owner;
  let agent1Wallet;
  let agent2Wallet;
  let stranger;
  let DEPOSIT_AMOUNT;

  const AGENT_A = 'css_dev';
  const AGENT_B = 'js_dev';

  before(async function () {
    ethers = hre.ethers;
    DEPOSIT_AMOUNT = ethers.parseEther('0.000001'); // 1000 gwei — symbolic
  });

  beforeEach(async function () {
    [owner, agent1Wallet, agent2Wallet, stranger] = await ethers.getSigners();

    const AgentEscrow = await ethers.getContractFactory('AgentEscrow');
    contract = await AgentEscrow.deploy();
    await contract.waitForDeployment();

    // Register wallets for our test agents
    await contract.registerWallet(AGENT_A, agent1Wallet.address);
    await contract.registerWallet(AGENT_B, agent2Wallet.address);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Access control
  // ──────────────────────────────────────────────────────────────────────────

  describe('Access Control', function () {
    it('sets deployer as owner', async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it('prevents non-owner from depositing', async function () {
      await expect(
        contract.connect(stranger).depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith('AgentEscrow: caller is not owner');
    });

    it('prevents non-owner from releasing payment', async function () {
      await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
      await expect(
        contract.connect(stranger).releasePayment(AGENT_A)
      ).to.be.revertedWith('AgentEscrow: caller is not owner');
    });

    it('prevents non-owner from rerouting payment', async function () {
      await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
      await expect(
        contract.connect(stranger).reroutePayment(AGENT_A, AGENT_B)
      ).to.be.revertedWith('AgentEscrow: caller is not owner');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Deposit
  // ──────────────────────────────────────────────────────────────────────────

  describe('depositEscrow()', function () {
    it('stores the correct escrow amount', async function () {
      await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
      const rec = await contract.getAgent(AGENT_A);
      expect(rec.escrowed).to.equal(DEPOSIT_AMOUNT);
    });

    it('emits EscrowDeposited event', async function () {
      await expect(contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT }))
        .to.emit(contract, 'EscrowDeposited')
        .withArgs(AGENT_A, DEPOSIT_AMOUNT);
    });

    it('accumulates multiple deposits', async function () {
      await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
      await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
      const rec = await contract.getAgent(AGENT_A);
      expect(rec.escrowed).to.equal(DEPOSIT_AMOUNT * 2n);
    });

    it('reverts with zero value', async function () {
      await expect(
        contract.depositEscrow(AGENT_A, { value: 0 })
      ).to.be.revertedWith('AgentEscrow: deposit amount must be > 0');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Release
  // ──────────────────────────────────────────────────────────────────────────

  describe('releasePayment()', function () {
    beforeEach(async function () {
      await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
    });

    it('transfers ETH to the agent wallet', async function () {
      const before = await ethers.provider.getBalance(agent1Wallet.address);
      await contract.releasePayment(AGENT_A);
      const after = await ethers.provider.getBalance(agent1Wallet.address);
      expect(after - before).to.equal(DEPOSIT_AMOUNT);
    });

    it('clears the escrowed amount', async function () {
      await contract.releasePayment(AGENT_A);
      const rec = await contract.getAgent(AGENT_A);
      expect(rec.escrowed).to.equal(0n);
    });

    it('increments tasksCompleted', async function () {
      await contract.releasePayment(AGENT_A);
      const rec = await contract.getAgent(AGENT_A);
      expect(rec.tasksCompleted).to.equal(1n);
    });

    it('sets reputation to 1 after first completion', async function () {
      await contract.releasePayment(AGENT_A);
      const rec = await contract.getAgent(AGENT_A);
      expect(rec.reputationScore).to.equal(1n);
    });

    it('emits PaymentReleased event', async function () {
      await expect(contract.releasePayment(AGENT_A))
        .to.emit(contract, 'PaymentReleased')
        .withArgs(AGENT_A, DEPOSIT_AMOUNT, 1n);
    });

    it('reverts when nothing is escrowed', async function () {
      await contract.releasePayment(AGENT_A);
      await expect(contract.releasePayment(AGENT_A))
        .to.be.revertedWith('AgentEscrow: nothing escrowed for this agent');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Reroute
  // ──────────────────────────────────────────────────────────────────────────

  describe('reroutePayment()', function () {
    beforeEach(async function () {
      await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
    });

    it('moves escrowed amount to replacement agent', async function () {
      await contract.reroutePayment(AGENT_A, AGENT_B);
      const recA = await contract.getAgent(AGENT_A);
      const recB = await contract.getAgent(AGENT_B);
      expect(recA.escrowed).to.equal(0n);
      expect(recB.escrowed).to.equal(DEPOSIT_AMOUNT);
    });

    it('increments tasksRerouted for fromAgent', async function () {
      await contract.reroutePayment(AGENT_A, AGENT_B);
      const rec = await contract.getAgent(AGENT_A);
      expect(rec.tasksRerouted).to.equal(1n);
    });

    it('emits PaymentRerouted event', async function () {
      await expect(contract.reroutePayment(AGENT_A, AGENT_B))
        .to.emit(contract, 'PaymentRerouted')
        .withArgs(AGENT_A, AGENT_B, DEPOSIT_AMOUNT);
    });

    it('allows toAgent to receive payment after reroute', async function () {
      await contract.reroutePayment(AGENT_A, AGENT_B);
      const before = await ethers.provider.getBalance(agent2Wallet.address);
      await contract.releasePayment(AGENT_B);
      const after = await ethers.provider.getBalance(agent2Wallet.address);
      expect(after - before).to.equal(DEPOSIT_AMOUNT);
    });

    it('reverts when nothing to reroute', async function () {
      await contract.reroutePayment(AGENT_A, AGENT_B);
      await expect(contract.reroutePayment(AGENT_A, AGENT_B))
        .to.be.revertedWith('AgentEscrow: nothing to reroute from this agent');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Reputation tracking
  // ──────────────────────────────────────────────────────────────────────────

  describe('Reputation Score', function () {
    it('reputation floors at 0 even with more reroutes than completions', async function () {
      // Reroute twice without any completions
      await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
      await contract.reroutePayment(AGENT_A, AGENT_B);
      await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
      await contract.reroutePayment(AGENT_A, AGENT_B);

      const rec = await contract.getAgent(AGENT_A);
      expect(rec.reputationScore).to.equal(0n);
    });

    it('tracks net reputation correctly over multiple tasks', async function () {
      // Complete 3 tasks, reroute 1 → net reputation = 2
      for (let i = 0; i < 3; i++) {
        await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
        await contract.releasePayment(AGENT_A);
      }
      await contract.depositEscrow(AGENT_A, { value: DEPOSIT_AMOUNT });
      await contract.reroutePayment(AGENT_A, AGENT_B);

      const rec = await contract.getAgent(AGENT_A);
      expect(rec.tasksCompleted).to.equal(3n);
      expect(rec.tasksRerouted).to.equal(1n);
      expect(rec.reputationScore).to.equal(2n);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Wallet registration
  // ──────────────────────────────────────────────────────────────────────────

  describe('registerWallet()', function () {
    it('registers the correct wallet address', async function () {
      expect(await contract.wallets(AGENT_A)).to.equal(agent1Wallet.address);
    });

    it('emits WalletRegistered event', async function () {
      await expect(contract.registerWallet('new_agent', agent2Wallet.address))
        .to.emit(contract, 'WalletRegistered')
        .withArgs('new_agent', agent2Wallet.address);
    });

    it('reverts on zero address', async function () {
      await expect(
        contract.registerWallet('bad_agent', ethers.ZeroAddress)
      ).to.be.revertedWith('AgentEscrow: zero address');
    });

    it('reverts when releasing without registered wallet', async function () {
      await contract.depositEscrow('unregistered_agent', { value: DEPOSIT_AMOUNT });
      await expect(
        contract.releasePayment('unregistered_agent')
      ).to.be.revertedWith('AgentEscrow: no wallet registered for agent');
    });
  });
});
