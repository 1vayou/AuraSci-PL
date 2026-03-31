# AuraSci — From Proof to Capital

Milestone-based open science funding powered by AI Agents.

**Live:** https://aura-sci-pl-47wr.vercel.app

## Protocol Stack

| Layer | Standard | Description |
|-------|----------|-------------|
| Identity | **ERC-8004** | AI agent identity & reputation registry (ERC-721 NFTs) |
| Funding | **ERC-8183** | Milestone-gated escrow — funds release only after AI verification |
| Payments | **x402** | HTTP 402 micropayments for premium research data (USDC on Base Sepolia) |
| Storage | **IPFS / Storacha** | Content-addressed decentralized storage for proofs & manifests |

## How It Works

```
Scientist submits research intent
        ↓
ERC-8004 AI Agent verifies milestones
        ↓
EIP-8183 escrow releases capital
        ↓
x402 micropayments unlock premium data
```

1. **Scientists** publish research intents with milestone roadmaps
2. **Patrons** fund research via Stripe (card) or USDC (crypto) into EIP-8183 escrow
3. **AI Agents** (ERC-8004 registered) verify milestone proofs uploaded to IPFS
4. **Escrow** releases funds to scientists on AI verification
5. **x402** enables pay-per-request access to premium datasets (0.50 USDC per query)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Wallet:** RainbowKit + wagmi + viem (Base Sepolia)
- **Payments:** Stripe (fiat) + x402 Protocol (@x402/core + @x402/evm)
- **Storage:** IPFS via Storacha (w3up-client)
- **Smart Contracts:** Solidity (ERC8004AgentRegistry, ERC8183Escrow)
- **State:** Zustand
- **Styling:** Tailwind CSS

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── x402/          # x402 payment endpoint (facilitator-verified)
│   │   ├── stripe/        # Stripe checkout
│   │   ├── agent/         # ERC-8004 agent registration & verification
│   │   └── ipfs/          # IPFS/Storacha uploads
│   ├── intent/[id]/       # Research intent detail + x402 payment
│   ├── market/            # Intent marketplace
│   ├── dashboard/         # Scientist & patron dashboards
│   ├── onboarding/        # Role selection & scientist onboarding
│   └── page.tsx           # Landing page
├── lib/
│   ├── x402.ts            # x402 server config (ResourceServer + Facilitator)
│   ├── x402-client.ts     # x402 client (wallet signing + payment flow)
│   ├── protocol.ts        # ERC-8004 & ERC-8183 protocol layer
│   └── web3.ts            # wagmi + RainbowKit config
├── components/
│   ├── PaymentModal.tsx   # Stripe + USDC payment modal
│   ├── IPFSUploader.tsx   # IPFS file upload component
│   └── ...
└── types/index.ts         # TypeScript interfaces
contracts/
├── ERC8004AgentRegistry.sol
└── ERC8183Escrow.sol
```

## x402 Payment Flow

The app uses the real [x402 protocol](https://x402.org) for micropayments:

1. User clicks "Pay 0.50 USDC via x402"
2. Client requests `/api/x402` → receives HTTP 402 + `PaymentRequired` header
3. Client signs EIP-712 typed-data payment authorization with connected wallet
4. Client retries with `X-PAYMENT-SIGNATURE` header
5. Server sends to Coinbase facilitator for verification
6. Facilitator settles USDC transfer on Base Sepolia
7. Server returns premium research data

**Packages:** `@x402/core`, `@x402/evm`
**Network:** Base Sepolia (eip155:84532)
**Token:** USDC

## Environment Variables

```bash
# Storacha (IPFS)
STORACHA_SPACE_DID=did:key:z6Mkt...
STORACHA_API_TOKEN=              # Optional — uses demo mode if empty

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# x402 Payment Protocol
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_PAY_TO=0xYourBaseSepolia...  # Wallet that receives USDC payments

# App
NEXT_PUBLIC_APP_URL=https://aura-sci-pl-47wr.vercel.app
NEXT_PUBLIC_WALLETCONNECT_ID=    # From cloud.walletconnect.com
NEXT_PUBLIC_RPC_URL=https://api.calibration.node.glif.io/rpc/v1
```

## Getting Started

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build
```

## Deploy to Vercel

1. Push to GitHub
2. Import into [Vercel](https://vercel.com/new)
3. Add environment variables (see above)
4. Deploy

## License

MIT
