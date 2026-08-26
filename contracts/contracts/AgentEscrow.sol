// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentEscrow
 * @notice Manages task-based escrow payments and on-chain reputation for the
 *         12-agent AI Dev Team. Deployed on Base Sepolia testnet.
 *
 * Flow:
 *   1. Orchestrator calls depositEscrow(agentId) with ETH when assigning a task.
 *   2a. On success: orchestrator calls releasePayment(agentId) → ETH sent to agent wallet,
 *       tasksCompleted++ and reputation recalculated.
 *   2b. On failure / reroute: orchestrator calls reroutePayment(fromAgentId, toAgentId) →
 *       escrowed ETH moves to the replacement agent, tasksRerouted++ for the failed agent.
 */
contract AgentEscrow {
    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;

    struct AgentRecord {
        uint256 escrowed;        // wei currently held in escrow for this agent
        uint256 reputationScore; // completed − rerouted (floored at 0)
        uint256 tasksCompleted;
        uint256 tasksRerouted;
    }

    /// @dev agentId (e.g. "pm", "css_dev") → on-chain record
    mapping(string => AgentRecord) public agents;

    /// @dev agentId → Ethereum wallet address that receives released payments
    mapping(string => address payable) public wallets;

    // ─── Events ───────────────────────────────────────────────────────────────

    event WalletRegistered(string indexed agentId, address wallet);
    event EscrowDeposited(string indexed agentId, uint256 amount);
    event PaymentReleased(string indexed agentId, uint256 amount, uint256 newReputation);
    event PaymentRerouted(string indexed fromAgentId, string indexed toAgentId, uint256 amount);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "AgentEscrow: caller is not owner");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Owner-only write functions ───────────────────────────────────────────

    /**
     * @notice Register an agent's wallet address. Must be called for each agent
     *         before releasePayment can transfer funds to it.
     */
    function registerWallet(string calldata agentId, address payable wallet) external onlyOwner {
        require(wallet != address(0), "AgentEscrow: zero address");
        wallets[agentId] = wallet;
        emit WalletRegistered(agentId, wallet);
    }

    /**
     * @notice Deposit ETH into escrow for a specific agent when a task is assigned.
     *         msg.value is the escrow amount (can be symbolic, e.g. 1000 wei).
     */
    function depositEscrow(string calldata agentId) external payable onlyOwner {
        require(msg.value > 0, "AgentEscrow: deposit amount must be > 0");
        agents[agentId].escrowed += msg.value;
        emit EscrowDeposited(agentId, msg.value);
    }

    /**
     * @notice Release escrowed payment to agent's registered wallet after a
     *         task passes verification (e.g. QA agent approval or human sign-off).
     *         Increments tasksCompleted and recalculates reputation.
     */
    function releasePayment(string calldata agentId) external onlyOwner {
        uint256 amount = agents[agentId].escrowed;
        require(amount > 0, "AgentEscrow: nothing escrowed for this agent");
        require(wallets[agentId] != address(0), "AgentEscrow: no wallet registered for agent");

        agents[agentId].escrowed = 0;
        agents[agentId].tasksCompleted += 1;
        agents[agentId].reputationScore = _calcReputation(agentId);

        wallets[agentId].transfer(amount);
        emit PaymentReleased(agentId, amount, agents[agentId].reputationScore);
    }

    /**
     * @notice Reroute escrowed payment from a failing agent to its replacement.
     *         Called by the existing fallback logic when an agent goes "on coffee break".
     *         Increments fromAgent's tasksRerouted and recalculates its reputation.
     *         The escrowed amount moves into toAgent's escrow (ready to be released on success).
     */
    function reroutePayment(string calldata fromAgentId, string calldata toAgentId) external onlyOwner {
        uint256 amount = agents[fromAgentId].escrowed;
        require(amount > 0, "AgentEscrow: nothing to reroute from this agent");

        agents[fromAgentId].escrowed = 0;
        agents[fromAgentId].tasksRerouted += 1;
        agents[fromAgentId].reputationScore = _calcReputation(fromAgentId);

        agents[toAgentId].escrowed += amount;
        emit PaymentRerouted(fromAgentId, toAgentId, amount);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    /**
     * @notice Get the full on-chain record for a single agent.
     */
    function getAgent(string calldata agentId) external view returns (AgentRecord memory) {
        return agents[agentId];
    }

    /**
     * @notice Total ETH held in this contract across all agents.
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    /**
     * @dev Reputation = tasksCompleted − tasksRerouted, floored at 0.
     */
    function _calcReputation(string memory agentId) internal view returns (uint256) {
        uint256 completed = agents[agentId].tasksCompleted;
        uint256 rerouted = agents[agentId].tasksRerouted;
        return completed > rerouted ? completed - rerouted : 0;
    }

    // ─── Receive / fallback ───────────────────────────────────────────────────

    /// @notice Allow the contract to receive ETH directly (e.g. from faucet top-ups).
    receive() external payable {}
}
