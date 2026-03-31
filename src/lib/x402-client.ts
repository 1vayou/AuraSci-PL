/**
 * x402 Client — browser-side payment signing via wagmi/viem wallet
 *
 * Creates an x402Client that uses the connected wallet to sign
 * EIP-712 typed-data payment authorizations for the facilitator.
 */
import { x402Client } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { toClientEvmSigner } from '@x402/evm';
import {
  encodePaymentSignatureHeader,
  decodePaymentRequiredHeader,
} from '@x402/core/http';
import type { WalletClient, PublicClient } from 'viem';
import type { PaymentRequired } from '@x402/core/types';

export { encodePaymentSignatureHeader, decodePaymentRequiredHeader };
export type { PaymentRequired };

/**
 * Build an x402Client using the connected wagmi wallet.
 *
 * @param walletClient - viem WalletClient from wagmi's useWalletClient()
 * @param publicClient - viem PublicClient from wagmi's usePublicClient()
 */
export function createX402PaymentClient(
  walletClient: WalletClient,
  publicClient: PublicClient,
): x402Client {
  const account = walletClient.account;
  if (!account) throw new Error('Wallet not connected');

  // Build a ClientEvmSigner from the wallet + public client
  const signer = toClientEvmSigner(
    {
      address: account.address,
      signTypedData: (args) =>
        walletClient.signTypedData({
          account,
          domain: args.domain as Record<string, unknown>,
          types: args.types as Record<string, unknown>,
          primaryType: args.primaryType,
          message: args.message as Record<string, unknown>,
        } as Parameters<typeof walletClient.signTypedData>[0]),
    },
    {
      readContract: (args) =>
        publicClient.readContract({
          address: args.address,
          abi: args.abi as readonly unknown[],
          functionName: args.functionName,
          args: args.args as readonly unknown[],
        } as Parameters<typeof publicClient.readContract>[0]),
    },
  );

  const client = new x402Client();
  registerExactEvmScheme(client, { signer });
  return client;
}

/**
 * Full x402 payment flow for a protected API endpoint.
 *
 * 1. Fetches the resource → gets 402 with PaymentRequired
 * 2. Signs a payment payload with the wallet
 * 3. Retries with X-PAYMENT-SIGNATURE header
 * 4. Returns the protected data
 */
export async function payAndFetch(
  url: string,
  body: Record<string, unknown>,
  walletClient: WalletClient,
  publicClient: PublicClient,
): Promise<{ ok: boolean; data: unknown; settleResponse?: unknown }> {
  // Step 1: Initial request → expect 402
  const initialRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (initialRes.status !== 402) {
    // Not a 402 — return as-is
    const data = await initialRes.json();
    return { ok: initialRes.ok, data };
  }

  // Step 2: Parse the PaymentRequired from header or body
  let paymentRequired: PaymentRequired;
  const prHeader = initialRes.headers.get('X-Payment-Required');
  if (prHeader) {
    paymentRequired = decodePaymentRequiredHeader(prHeader);
  } else {
    paymentRequired = await initialRes.json();
  }

  // Step 3: Create a payment payload (wallet signs EIP-712 typed data)
  const client = createX402PaymentClient(walletClient, publicClient);
  const paymentPayload = await client.createPaymentPayload(paymentRequired);

  // Step 4: Encode and retry
  const signatureHeader = encodePaymentSignatureHeader(paymentPayload);

  const paidRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PAYMENT-SIGNATURE': signatureHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await paidRes.json();

  // Parse settlement response if present
  let settleResponse;
  const settleHeader = paidRes.headers.get('X-Payment-Response');
  if (settleHeader) {
    try {
      const { decodePaymentResponseHeader } = await import('@x402/core/http');
      settleResponse = decodePaymentResponseHeader(settleHeader);
    } catch { /* ignore decode errors */ }
  }

  return { ok: paidRes.ok, data, settleResponse };
}
