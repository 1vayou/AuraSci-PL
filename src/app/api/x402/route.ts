/**
 * x402 Payment Middleware — HTTP 402 for research data access
 * GET  /api/x402?resource=... — returns 402 payment challenge
 * POST /api/x402              — verifies payment, settles on-chain, returns data
 *
 * Uses @x402/core + @x402/evm for real facilitator-verified payments on Base Sepolia.
 * x402 spec: https://x402.org
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getX402Server,
  encodePaymentRequiredHeader,
  decodePaymentSignatureHeader,
  encodePaymentResponseHeader,
  X402_PAY_TO,
  X402_NETWORK,
  X402_PRICE,
} from '@/lib/x402';
import type { ResourceConfig } from '@x402/core/server';

// ── Shared resource config ──────────────────────────────────────────────────

function buildResourceConfig(): ResourceConfig {
  return {
    scheme: 'exact',
    network: X402_NETWORK,
    payTo: X402_PAY_TO,
    price: X402_PRICE,
    maxTimeoutSeconds: 300,
  };
}

// ── GET: return 402 Payment Required ────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const server = await getX402Server();
    const { searchParams } = new URL(req.url);
    const resourceUrl = searchParams.get('resource') ?? req.url;

    const resourceConfig = buildResourceConfig();
    const requirements = await server.buildPaymentRequirements(resourceConfig);

    const paymentRequired = await server.createPaymentRequiredResponse(
      requirements,
      { url: resourceUrl, description: 'Access to AuraSci premium research data', mimeType: 'application/json' },
      'Payment required to access this AuraSci research endpoint',
    );

    const paymentRequiredHeader = encodePaymentRequiredHeader(paymentRequired);

    return NextResponse.json(paymentRequired, {
      status: 402,
      headers: {
        'X-Payment-Required': paymentRequiredHeader,
        'X-Payment-Protocol': 'x402',
        'X-Payment-Network': X402_NETWORK,
      },
    });
  } catch (err) {
    console.error('[x402 GET] Error building payment challenge:', err);
    return NextResponse.json(
      { error: 'Failed to build payment challenge', details: String(err) },
      { status: 500 },
    );
  }
}

// ── POST: verify payment & return protected data ────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const server = await getX402Server();
    const paymentSignature = req.headers.get('X-PAYMENT-SIGNATURE') ?? req.headers.get('x-payment-signature');
    const { resource, intentId } = await req.json().catch(() => ({ resource: '', intentId: '' }));

    const resourceConfig = buildResourceConfig();
    const resourceInfo = {
      url: resource || req.url,
      description: `Access research data for intent ${intentId}`,
      mimeType: 'application/json',
    };

    // No payment signature → return 402 challenge
    if (!paymentSignature) {
      const requirements = await server.buildPaymentRequirements(resourceConfig);
      const paymentRequired = await server.createPaymentRequiredResponse(
        requirements,
        resourceInfo,
        'Payment required — include X-PAYMENT-SIGNATURE header',
      );
      const paymentRequiredHeader = encodePaymentRequiredHeader(paymentRequired);

      return NextResponse.json(paymentRequired, {
        status: 402,
        headers: {
          'X-Payment-Required': paymentRequiredHeader,
          'X-Payment-Protocol': 'x402',
        },
      });
    }

    // Decode the payment payload from the header
    let paymentPayload;
    try {
      paymentPayload = decodePaymentSignatureHeader(paymentSignature);
    } catch {
      return NextResponse.json(
        { error: 'Invalid X-PAYMENT-SIGNATURE header — could not decode' },
        { status: 400 },
      );
    }

    // Build requirements and find matching ones
    const requirements = await server.buildPaymentRequirements(resourceConfig);
    const matchedRequirements = server.findMatchingRequirements(requirements, paymentPayload);

    if (!matchedRequirements) {
      return NextResponse.json(
        { error: 'No matching payment requirements for the provided payload' },
        { status: 400 },
      );
    }

    // Verify via facilitator
    const verifyResult = await server.verifyPayment(paymentPayload, matchedRequirements);
    if (!verifyResult.isValid) {
      return NextResponse.json(
        {
          error: 'Payment verification failed',
          reason: verifyResult.invalidReason,
          message: verifyResult.invalidMessage,
        },
        { status: 402 },
      );
    }

    // Settle via facilitator (on-chain USDC transfer)
    const settleResult = await server.settlePayment(paymentPayload, matchedRequirements);
    if (!settleResult.success) {
      return NextResponse.json(
        {
          error: 'Payment settlement failed',
          reason: settleResult.errorReason,
          message: settleResult.errorMessage,
        },
        { status: 502 },
      );
    }

    // Payment verified & settled — return protected data
    const responseHeaders: Record<string, string> = {
      'X-Payment-Protocol': 'x402',
      'X-Payment-Response': encodePaymentResponseHeader(settleResult),
    };

    return NextResponse.json(
      {
        success: true,
        paymentVerified: true,
        protocol: 'x402',
        payer: settleResult.payer,
        settlement: {
          transaction: settleResult.transaction,
          network: settleResult.network,
        },
        data: {
          intentId,
          premiumData: {
            fullDatasetCid: `QmPremium${Date.now().toString(36)}`,
            analysisReport: 'Full AI analysis report unlocked via x402 payment',
            computeResults: 'Premium compute results available',
            accessGrantedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
        message: '⚡ x402 payment verified & settled on-chain. Premium data access granted.',
      },
      { status: 200, headers: responseHeaders },
    );
  } catch (err) {
    console.error('[x402 POST] Error processing payment:', err);
    return NextResponse.json(
      { error: 'Payment processing error', details: String(err) },
      { status: 500 },
    );
  }
}
