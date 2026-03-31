/**
 * x402 Payment Protocol — shared configuration & server singleton
 *
 * Uses @x402/core + @x402/evm for real HTTP 402 payment flows
 * on Base Sepolia with USDC via a Coinbase facilitator.
 */
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import {
  encodePaymentRequiredHeader,
  decodePaymentSignatureHeader,
  encodePaymentResponseHeader,
} from '@x402/core/http';
import type { PaymentRequired, PaymentPayload, SettleResponse } from '@x402/core/types';

// ── Config ──────────────────────────────────────────────────────────────────

export const X402_FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL ?? 'https://x402.org/facilitator';

export const X402_PAY_TO =
  (process.env.X402_PAY_TO ?? '0x209693Bc605Baf0C5d080C4B57F94F3b2CA206a0') as `0x${string}`;

export const X402_NETWORK = 'eip155:84532' as const; // Base Sepolia
export const X402_PRICE = '$0.50';

// ── Server singleton (lazy-init) ────────────────────────────────────────────

let _server: x402ResourceServer | null = null;
let _initPromise: Promise<void> | null = null;

export async function getX402Server(): Promise<x402ResourceServer> {
  if (_server && _initPromise) {
    await _initPromise;
    return _server;
  }

  const facilitator = new HTTPFacilitatorClient({ url: X402_FACILITATOR_URL });
  _server = new x402ResourceServer(facilitator);
  _server.register('eip155:*', new ExactEvmScheme());
  _initPromise = _server.initialize();
  await _initPromise;
  return _server;
}

// ── Header helpers ──────────────────────────────────────────────────────────

export { encodePaymentRequiredHeader, decodePaymentSignatureHeader, encodePaymentResponseHeader };
export type { PaymentRequired, PaymentPayload, SettleResponse };
