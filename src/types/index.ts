export type UserRole = 'scientist' | 'patron' | 'guest';

export type ResearchTag =
  | '#Longevity' | '#AI-Bio' | '#Neuroscience' | '#Genomics'
  | '#Quantum' | '#Climate' | '#Tier-1' | '#Tier-2' | '#DeSci';

export interface ScientistProfile {
  id: string;
  fullName: string;
  email: string;
  handle: string;
  affiliation: string;
  bio: string;
  status: 'pending_review' | 'approved';
  avatarUrl?: string;
  tags?: ResearchTag[];
  orcidId?: string;
  // ERC-8004 Agent fields
  agentNftId?: string;          // ERC-721 token ID in Identity Registry
  agentDid?: string;            // DID linked to IPFS agent.json manifest
  agentManifestCid?: string;    // IPFS CID of agent.json
  reputationScore?: number;     // From ERC-8004 Reputation Registry
  walletAddress?: string;
}

export type MilestoneStatus =
  | 'locked' | 'in_progress' | 'proof_submitted'
  | 'ai_verified' | 'released';
export type MilestoneLabel = 'M0' | 'M1' | 'M2' | 'M3' | 'R' | 'SSR';

export interface Milestone {
  id: string;
  intentId: string;
  order: 1 | 2 | 3;
  label: MilestoneLabel;
  sublabel: string;
  estTime: string;
  objective: string;
  deliverables: string;
  verificationCriteria: string;
  releaseAmountUSDC: number;
  status: MilestoneStatus;
  proofLinks?: string[];
  // IPFS / Protocol Labs
  ipfsCid?: string;             // IPFS CID of proof artifact
  proofFilename?: string;       // Original filename pinned to IPFS
  // ERC-8004
  agentId?: string;             // ERC-8004 agent that verified this milestone
  agentReputation?: number;
  verificationTxHash?: string;  // Simulated on-chain tx
  validationRegistryEntry?: string;
  // EIP-8183
  escrowTxHash?: string;        // Escrow release tx hash
  releaseTimestamp?: number;
}

export type IntentStatus = 'draft' | 'ai_screening' | 'published' | 'funded' | 'completed';

export interface Patron {
  id: string;
  name: string;
  avatarUrl?: string;
  amountUSDC: number;
  escrowTxHash?: string;        // EIP-8183 escrow deposit tx
  walletAddress?: string;
}

export interface Backer {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface ResourceAsk {
  type: 'compute' | 'data' | 'equipment' | 'talent';
  description: string;
  quantity: string;
}

export type ActivityType =
  | 'patronage' | 'proof_submitted' | 'ai_verified'
  | 'intent_published' | 'milestone_unlocked'
  | 'ipfs_pinned' | 'agent_registered' | 'escrow_released' | 'x402_payment';

export interface ActivityLog {
  id: string;
  timestamp: number;
  type: ActivityType;
  message: string;
  ticker?: string;
  intentId?: string;
  txHash?: string;
  ipfsCid?: string;
}

export interface IntentAsset {
  id: string;
  scientistId: string;
  title: string;
  ticker: string;
  coreHypothesis: string;
  evidenceLinks: string[];
  fundingGoalUSDC: number;
  escrowedAmountUSDC: number;
  status: IntentStatus;
  milestones: Milestone[];
  aiScore?: number;
  tags?: ResearchTag[];
  patrons?: Patron[];
  backers?: Backer[];
  resourceAsks?: ResourceAsk[];
  trendingRank?: number;
  supporterCount?: number;
  boostScore?: number;
  // Protocol Labs stack
  ipfsCid?: string;             // IPFS CID of full intent JSON (pinned via Storacha)
  agentId?: string;             // ERC-8004 agent ID
  agentReputation?: number;
  agentManifestCid?: string;    // IPFS CID of agent.json manifest
  registrationTxHash?: string;  // ERC-8004 Identity Registry tx
  createdAt?: number;
}

// ── Protocol Layer types ─────────────────────────────────────────────────────

export interface ERC8004Agent {
  tokenId: string;
  did: string;
  manifestCid: string;         // IPFS CID
  owner: string;               // wallet address
  reputationScore: number;
  tasksCompleted: number;
  registrationTx: string;
  network: string;
}

export interface ERC8183EscrowJob {
  jobId: string;
  intentId: string;
  milestoneId: string;
  totalUSDC: number;
  depositorAddress: string;
  recipientAddress: string;
  evaluatorAgentId: string;
  status: 'pending' | 'active' | 'verified' | 'released' | 'disputed';
  createTx: string;
  releaseTx?: string;
}

export interface X402PaymentChallenge {
  type: 'X402';
  accepts: Array<{
    scheme: 'exact';
    network: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    mimeType: string;
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string;
    extra: { name: string; version: string };
  }>;
  error: string;
}

export interface IPFSUploadResult {
  cid: string;
  url: string;
  filename: string;
  size: number;
  storachaDid: string;
  timestamp: number;
}
