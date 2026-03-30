/**
 * ERC-8004 Agent Verification API
 * POST /api/agent — triggers AI verification of a milestone proof
 * GET  /api/agent?id=... — fetches agent registry info
 */
import { NextRequest, NextResponse } from 'next/server';
import { registerAgent, updateReputation, buildAgentManifest, NETWORK } from '@/lib/protocol';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, intentId, milestoneId, agentId, scientistId, manifestCid } = body;

    if (action === 'register') {
      const agent = registerAgent(scientistId, manifestCid ?? 'QmDemo');
      return NextResponse.json({
        success: true,
        agent,
        network: NETWORK,
        message: `🤖 ERC-8004 Agent registered as NFT (token: ${agent.tokenId})`,
        explorerUrl: `${NETWORK.explorer}${agent.registrationTx}`,
      });
    }

    if (action === 'verify') {
      // Simulate AI analysis with a short delay
      await new Promise(r => setTimeout(r, 800));

      const repTx = updateReputation(agentId ?? 'ERC8004-0000', 5);
      const score = 75 + Math.floor(Math.random() * 24); // 75–99

      return NextResponse.json({
        success: true,
        verified: score >= 70,
        score,
        agentId: agentId ?? 'ERC8004-0000',
        intentId,
        milestoneId,
        reputationTx: repTx,
        explorerUrl: `${NETWORK.explorer}${repTx}`,
        network: NETWORK,
        registries: {
          validationRegistry: `VALREG-${Date.now().toString(36).toUpperCase()}`,
          reputationDelta: +5,
          multiRegistryBoost: true,
        },
        message: `🛡️ ERC-8004 multi-registry verification complete. Reputation updated on ${NETWORK.name}.`,
      });
    }

    if (action === 'manifest') {
      const manifest = buildAgentManifest({
        id: scientistId,
        fullName: body.fullName ?? 'Scientist',
        affiliation: body.affiliation ?? 'AuraSci',
        tags: body.tags ?? [],
      });
      return NextResponse.json({ success: true, manifest });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  return NextResponse.json({
    registry: 'ERC-8004 Identity & Reputation Registry',
    network: NETWORK,
    agentId: id ?? 'all',
    contracts: {
      identityRegistry: '0xAuraSci8004Identity000000000000000000001',
      reputationRegistry: '0xAuraSci8004Reputation00000000000000002',
      validationRegistry: '0xAuraSci8004Validation000000000000000003',
    },
    docs: 'https://eips.ethereum.org/EIPS/eip-8004',
  });
}
