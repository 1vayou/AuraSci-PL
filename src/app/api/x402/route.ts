/**
 * x402 Payment Middleware — HTTP 402 for research data access
 * GET  /api/x402?resource=... — returns payment challenge (HTTP 402)
 * POST /api/x402 — verifies payment header and returns protected data
 *
 * x402 spec: https://x402.org
 * This endpoint demonstrates charging USDC for premium research data queries.
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildX402Challenge, verifyX402Payment } from '@/lib/protocol';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get('resource') ?? req.url;
  const amount = parseFloat(searchParams.get('amount') ?? '0.50');

  const challenge = buildX402Challenge(resource, amount, 'Access to AuraSci premium research data');

  return NextResponse.json(challenge, {
    status: 402,
    headers: {
      'X-Payment-Required': 'true',
      'X-Payment-Protocol': 'x402',
      'X-Payment-Network': 'base-sepolia',
      'X-Payment-Asset': 'USDC',
      'X-Payment-Amount': String(amount),
    },
  });
}

export async function POST(req: NextRequest) {
  const paymentHeader = req.headers.get('X-Payment');
  const { resource, intentId } = await req.json().catch(() => ({ resource: '', intentId: '' }));

  // ── Verify x402 payment ───────────────────────────────────────────────────
  if (!verifyX402Payment(paymentHeader)) {
    const challenge = buildX402Challenge(
      resource ?? req.url, 0.50,
      `Access research data for intent ${intentId}`,
    );
    return NextResponse.json(challenge, {
      status: 402,
      headers: {
        'X-Payment-Required': 'true',
        'X-Payment-Protocol': 'x402',
      },
    });
  }

  // ── Payment verified — return protected research data ─────────────────────
  return NextResponse.json({
    success: true,
    paymentVerified: true,
    protocol: 'x402',
    data: {
      intentId,
      premiumData: {
        fullDatasetCid: `QmPremium${Math.random().toString(36).slice(2, 12)}`,
        analysisReport: 'Full AI analysis report unlocked via x402 payment',
        computeResults: 'Premium compute results available',
        accessGrantedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    message: '⚡ x402 payment verified. Premium data access granted.',
    txHash: `0xX402${Date.now().toString(16)}`,
  });
}
