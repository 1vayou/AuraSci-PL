// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AuraSci ERC-8183 Research Funding Escrow
 * @notice Milestone-gated escrow for trustless scientist–patron funding.
 *         Funds release only after ERC-8004 AI agent verification.
 * @dev    Integrates with ERC8004AgentRegistry for evaluator lookup.
 */

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

interface IERC8004 {
    function updateReputation(uint256 tokenId, int256 delta) external;
    function attestValidation(string calldata intentId, string calldata milestoneId, uint256 agentTokenId, bool passed) external returns (bytes32);
}

contract ERC8183Escrow {

    // ── Storage ───────────────────────────────────────────────────────────────

    address public owner;
    IERC20  public usdc;
    IERC8004 public agentRegistry;

    enum JobStatus { Pending, Active, Verified, Released, Disputed }

    struct Job {
        string   jobId;
        string   intentId;
        string   milestoneId;
        uint256  totalUSDC;
        address  depositor;
        address  recipient;
        uint256  evaluatorAgentTokenId;
        JobStatus status;
        uint256  createdAt;
        uint256  releasedAt;
        bytes32  validationHash;
    }

    mapping(string => Job) public jobs;
    string[] public jobIds;

    // ── Events ────────────────────────────────────────────────────────────────

    event JobCreated(string indexed jobId, string intentId, string milestoneId, uint256 amountUSDC);
    event JobVerified(string indexed jobId, bytes32 validationHash, uint256 agentTokenId);
    event FundsReleased(string indexed jobId, address indexed recipient, uint256 amountUSDC);
    event DisputeRaised(string indexed jobId, address indexed by, string reason);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _usdc, address _agentRegistry) {
        owner          = msg.sender;
        usdc           = IERC20(_usdc);
        agentRegistry  = IERC8004(_agentRegistry);
    }

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    // ── Escrow Lifecycle ──────────────────────────────────────────────────────

    /**
     * @notice Patron deposits USDC into escrow for a specific milestone.
     * @param  jobId                Unique job identifier
     * @param  intentId             Research intent ID (AuraSci)
     * @param  milestoneId          Milestone ID
     * @param  amountUSDC           Amount in USDC (6 decimals)
     * @param  recipient            Scientist's wallet address
     * @param  evaluatorAgentTokenId ERC-8004 token ID of the verifying AI agent
     */
    function createJob(
        string calldata jobId,
        string calldata intentId,
        string calldata milestoneId,
        uint256 amountUSDC,
        address recipient,
        uint256 evaluatorAgentTokenId
    ) external {
        require(bytes(jobs[jobId].jobId).length == 0, "Job already exists");
        require(amountUSDC > 0, "Amount must be > 0");

        bool ok = usdc.transferFrom(msg.sender, address(this), amountUSDC);
        require(ok, "USDC transfer failed");

        jobs[jobId] = Job({
            jobId:                 jobId,
            intentId:              intentId,
            milestoneId:           milestoneId,
            totalUSDC:             amountUSDC,
            depositor:             msg.sender,
            recipient:             recipient,
            evaluatorAgentTokenId: evaluatorAgentTokenId,
            status:                JobStatus.Active,
            createdAt:             block.timestamp,
            releasedAt:            0,
            validationHash:        bytes32(0)
        });
        jobIds.push(jobId);

        emit JobCreated(jobId, intentId, milestoneId, amountUSDC);
    }

    /**
     * @notice AI agent verifies milestone completion and triggers escrow release.
     * @param  jobId     Job to verify
     * @param  passed    Whether the milestone passed AI verification
     */
    function verifyAndRelease(string calldata jobId, bool passed) external {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Active, "Job not active");

        // Attest on ERC-8004 Validation Registry
        bytes32 valHash = agentRegistry.attestValidation(
            job.intentId, job.milestoneId, job.evaluatorAgentTokenId, passed
        );
        job.validationHash = valHash;

        if (passed) {
            job.status     = JobStatus.Verified;
            job.releasedAt = block.timestamp;

            // Update agent reputation
            agentRegistry.updateReputation(job.evaluatorAgentTokenId, 5);

            // Release funds to scientist
            bool ok = usdc.transfer(job.recipient, job.totalUSDC);
            require(ok, "USDC release failed");
            job.status = JobStatus.Released;

            emit JobVerified(jobId, valHash, job.evaluatorAgentTokenId);
            emit FundsReleased(jobId, job.recipient, job.totalUSDC);
        }
    }

    /**
     * @notice Dispute a job — funds held until resolution.
     */
    function raiseDispute(string calldata jobId, string calldata reason) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.depositor || msg.sender == job.recipient, "Unauthorized");
        job.status = JobStatus.Disputed;
        emit DisputeRaised(jobId, msg.sender, reason);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function getJob(string calldata jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    function totalJobs() external view returns (uint256) {
        return jobIds.length;
    }

    function contractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
