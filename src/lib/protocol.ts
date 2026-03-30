/**
 * AuraSci Protocol Layer
 * Simulates ERC-8004, ERC-8183, and x402 interactions.
 * Smart contract code lives in /contracts — these functions mirror
 * real on-chain behaviour with deterministic mock tx hashes for demo.
 */

import type {
  ERC8004Agent, ERC8183EscrowJob, X402PaymentChallenge, IPFSUploadResult
} from '@/types';

// ── Utilities ────────────────────────────────────────────────────────────────

function fakeTxHash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0; }
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return `0x${hex}${'abcdef1234567890'.repeat(4).slice(0, 56)}`;
}

function fakeAddress(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = (Math.imul(17, h) + seed.charCodeAt(i)) | 0; }
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return `0x${hex}${'1a2b3c4d5e6f'.repeat(3).slice(0, 32)}`;
}

export const NETWORK = {
  name: 'Filecoin Calibration',
  chainId: 314159,
  explorer: 'https://calibration.filscan.io/tx/',
  rpc: 'https://api.calibration.node.glif.io/rpc/v1',
  symbol: 'tFIL',
};

// ── ERC-8004 Identity & Reputation Registry ──────────────────────────────────

/**
 * Simulates registering a scientist's AI agent as an ERC-721 NFT
 * with a metadata URI pointing to an IPFS agent.json manifest.
 */
export function registerAgent(scientistId: string, manifestCid: string): ERC8004Agent {
  const tokenId = `ERC8004-${Math.abs(parseInt(scientistId.slice(-4), 36) % 10000).toString().padStart(4, '0')}`;
  return {
    tokenId,
    did: `did:web:aurasci.network:agents:${tokenId.toLowerCase()}`,
    manifestCid,
    owner: fakeAddress(scientistId),
    reputationScore: 85 + (parseInt(scientistId.slice(-2), 36) % 15),
    tasksCompleted: 0,
    registrationTx: fakeTxHash(`register_${scientistId}_${manifestCid}`),
    network: NETWORK.name,
  };
}

/**
 * Simulates updating the ERC-8004 Reputation Registry after a verified task.
 * Returns the new reputation tx hash.
 */
export function updateReputation(agentTokenId: string, delta: number): string {
  return fakeTxHash(`rep_update_${agentTokenId}_${delta}_${Date.now()}`);
}

/**
 * Generates an agent.json manifest for IPFS storage (DevSpot compatible).
 */
export function buildAgentManifest(scientist: { id: string; fullName: string; affiliation: string; tags?: string[] }) {
  return {
    schema: 'ERC-8004-v1',
    name: `AuraSci Verification Agent — ${scientist.fullName}`,
    description: `AI validation agent for ${scientist.affiliation} research intents on AuraSci Protocol`,
    version: '1.0.0',
    owner: scientist.id,
    capabilities: ['milestone_verification', 'proof_analysis', 'reputation_update'],
    research_domains: scientist.tags ?? [],
    protocol: {
      identityRegistry: 'ERC-8004',
      paymentJob: 'ERC-8183',
      micropayment: 'x402',
      storage: 'IPFS/Storacha',
    },
    created: new Date().toISOString(),
  };
}

// ── ERC-8183 Escrow Job ───────────────────────────────────────────────────────

/**
 * Simulates creating an ERC-8183 escrowed job for milestone funding.
 */
export function createEscrowJob(
  intentId: string,
  milestoneId: string,
  amountUSDC: number,
  depositorAddress: string,
  recipientAddress: string,
  evaluatorAgentId: string,
): ERC8183EscrowJob {
  const jobId = `JOB-${Date.now().toString(36).toUpperCase()}`;
  return {
    jobId,
    intentId,
    milestoneId,
    totalUSDC: amountUSDC,
    depositorAddress,
    recipientAddress,
    evaluatorAgentId,
    status: 'active',
    createTx: fakeTxHash(`escrow_create_${jobId}_${amountUSDC}`),
  };
}

/**
 * Simulates releasing an ERC-8183 escrow after AI verification.
 */
export function releaseEscrow(job: ERC8183EscrowJob): ERC8183EscrowJob {
  return {
    ...job,
    status: 'released',
    releaseTx: fakeTxHash(`escrow_release_${job.jobId}_${Date.now()}`),
  };
}

// ── x402 Payment Middleware ───────────────────────────────────────────────────

/**
 * Generates an x402 HTTP 402 payment challenge for a protected API endpoint.
 * Used as middleware in Next.js API routes.
 */
export function buildX402Challenge(
  resource: string,
  amountUSDC: number,
  description: string,
): X402PaymentChallenge {
  return {
    type: 'X402',
    accepts: [
      {
        scheme: 'exact',
        network: 'base-sepolia',
        maxAmountRequired: String(Math.round(amountUSDC * 1_000_000)), // USDC 6 decimals
        resource,
        description,
        mimeType: 'application/json',
        payTo: '0xAuraSci000000000000000000000000000000001',
        maxTimeoutSeconds: 300,
        asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
        extra: { name: 'USDC', version: '2' },
      },
    ],
    error: 'Payment required to access this AuraSci research endpoint',
  };
}

/**
 * Simulates verifying an x402 payment header.
 * In production this would verify the on-chain USDC transfer.
 */
export function verifyX402Payment(paymentHeader: string | null): boolean {
  if (!paymentHeader) return false;
  // Demo: any non-empty header is accepted
  return paymentHeader.startsWith('X402-');
}

// ── IPFS CID utilities ────────────────────────────────────────────────────────

export function mockIPFSResult(filename: string, content: string): IPFSUploadResult {
  const size = new TextEncoder().encode(content).length;
  // Generate a deterministic-looking CID (starts with Qm = CIDv0)
  let h = 0;
  for (let i = 0; i < content.slice(0, 200).length; i++) {
    h = (Math.imul(31, h) + content.charCodeAt(i)) | 0;
  }
  const suffix = Math.abs(h).toString(16).padStart(8, '0');
  const cid = `QmAuraSci${suffix}PL${'abcdefghijklmnopqrstuvwxyz0123456789'.slice(0, 30)}`;
  return {
    cid,
    url: `https://w3s.link/ipfs/${cid}`,
    filename,
    size,
    storachaDid: process.env.STORACHA_SPACE_DID ?? 'did:key:z6MktDavuL1M2VdtHe2nVnhCaD8CiTmchWmyn8x2sEPbfvey',
    timestamp: Date.now(),
  };
}
