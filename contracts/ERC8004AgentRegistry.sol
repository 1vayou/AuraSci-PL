// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AuraSci ERC-8004 Agent Registry
 * @notice Three-registry implementation of ERC-8004 for AI agent infrastructure:
 *         Identity Registry (ERC-721 NFTs), Reputation Registry, Validation Registry.
 * @dev    Agent metadata URIs point to IPFS agent.json manifests (pinned via Storacha).
 *         Designed for Filecoin EVM (FEVM) deployment.
 */

interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
}

contract ERC8004AgentRegistry is IERC721 {

    // ── Storage ───────────────────────────────────────────────────────────────

    string  public name     = "AuraSci AI Agent";
    string  public symbol   = "AURA8004";
    address public owner;
    uint256 private _nextTokenId = 1;

    struct AgentIdentity {
        uint256 tokenId;
        address agentOwner;
        string  did;            // Decentralised Identifier
        string  manifestCid;    // IPFS CID of agent.json (Storacha)
        uint256 registeredAt;
        bool    active;
    }

    struct AgentReputation {
        uint256 score;          // 0-100
        uint256 tasksCompleted;
        uint256 tasksVerified;
        uint256 lastUpdated;
    }

    struct ValidationEntry {
        bytes32 taskHash;       // keccak256(intentId, milestoneId)
        uint256 agentTokenId;
        address attestedBy;
        uint256 timestamp;
        bool    passed;
    }

    // Identity Registry
    mapping(uint256 => AgentIdentity)    public identityRegistry;
    mapping(address => uint256)          private _ownerToToken;
    mapping(uint256 => address)          private _tokenOwner;
    mapping(address => uint256)          private _balances;

    // Reputation Registry
    mapping(uint256 => AgentReputation)  public reputationRegistry;

    // Validation Registry (multi-registry for hackathon bonus)
    ValidationEntry[]                    public validationRegistry;
    mapping(bytes32 => uint256)          public taskToValidation;

    // ── Events ────────────────────────────────────────────────────────────────

    event AgentRegistered(uint256 indexed tokenId, address indexed owner, string did, string manifestCid);
    event ReputationUpdated(uint256 indexed tokenId, uint256 newScore, int256 delta);
    event MilestoneValidated(bytes32 indexed taskHash, uint256 indexed agentTokenId, bool passed);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor() { owner = msg.sender; }

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    // ── Identity Registry ─────────────────────────────────────────────────────

    /**
     * @notice Register a new AI agent as an ERC-721 NFT.
     * @param  did         Decentralised Identifier (e.g. did:web:aurasci.network:agents:...)
     * @param  manifestCid IPFS CID of the agent.json manifest (Storacha-pinned)
     */
    function registerAgent(string calldata did, string calldata manifestCid)
        external
        returns (uint256 tokenId)
    {
        require(_ownerToToken[msg.sender] == 0, "Agent already registered");
        tokenId = _nextTokenId++;

        identityRegistry[tokenId] = AgentIdentity({
            tokenId:      tokenId,
            agentOwner:   msg.sender,
            did:          did,
            manifestCid:  manifestCid,
            registeredAt: block.timestamp,
            active:       true
        });

        reputationRegistry[tokenId] = AgentReputation({
            score:          85,
            tasksCompleted: 0,
            tasksVerified:  0,
            lastUpdated:    block.timestamp
        });

        _ownerToToken[msg.sender] = tokenId;
        _tokenOwner[tokenId]      = msg.sender;
        _balances[msg.sender]    += 1;

        emit Transfer(address(0), msg.sender, tokenId);
        emit AgentRegistered(tokenId, msg.sender, did, manifestCid);
    }

    // ── Reputation Registry ───────────────────────────────────────────────────

    /**
     * @notice Update an agent's reputation score after task completion.
     * @param  tokenId Token ID of the agent
     * @param  delta   Score change (positive = reward, negative = slash)
     */
    function updateReputation(uint256 tokenId, int256 delta) external {
        require(_tokenOwner[tokenId] != address(0), "Agent not found");
        AgentReputation storage rep = reputationRegistry[tokenId];

        uint256 current = rep.score;
        if (delta > 0) {
            rep.score = current + uint256(delta) > 100 ? 100 : current + uint256(delta);
        } else {
            uint256 decrease = uint256(-delta);
            rep.score = current > decrease ? current - decrease : 0;
        }
        rep.lastUpdated = block.timestamp;

        emit ReputationUpdated(tokenId, rep.score, delta);
    }

    function incrementTasksCompleted(uint256 tokenId) external {
        reputationRegistry[tokenId].tasksCompleted += 1;
    }

    // ── Validation Registry ───────────────────────────────────────────────────

    /**
     * @notice Attest task completion — boosts hackathon multi-registry score.
     * @param  intentId     AuraSci research intent ID
     * @param  milestoneId  Milestone ID
     * @param  agentTokenId ERC-8004 token ID of the verifying agent
     * @param  passed       Verification result
     */
    function attestValidation(
        string calldata intentId,
        string calldata milestoneId,
        uint256 agentTokenId,
        bool passed
    ) external returns (bytes32 taskHash) {
        taskHash = keccak256(abi.encodePacked(intentId, milestoneId));
        uint256 idx = validationRegistry.length;

        validationRegistry.push(ValidationEntry({
            taskHash:    taskHash,
            agentTokenId: agentTokenId,
            attestedBy:  msg.sender,
            timestamp:   block.timestamp,
            passed:      passed
        }));

        taskToValidation[taskHash] = idx;
        reputationRegistry[agentTokenId].tasksVerified += 1;

        emit MilestoneValidated(taskHash, agentTokenId, passed);
    }

    // ── ERC-721 view functions ────────────────────────────────────────────────

    function ownerOf(uint256 tokenId) external view returns (address) {
        return _tokenOwner[tokenId];
    }

    function balanceOf(address _owner) external view returns (uint256) {
        return _balances[_owner];
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        AgentIdentity memory agent = identityRegistry[tokenId];
        return string(abi.encodePacked("ipfs://", agent.manifestCid));
    }

    function getAgent(uint256 tokenId) external view returns (AgentIdentity memory, AgentReputation memory) {
        return (identityRegistry[tokenId], reputationRegistry[tokenId]);
    }

    function validationCount() external view returns (uint256) {
        return validationRegistry.length;
    }
}
