# Deploy AuraSci-PL — 4 Steps

## Step 1: Open Terminal
Mac: Press `Cmd + Space`, type "Terminal", press Enter

## Step 2: Paste these commands (one by one)

```bash
cd ~/AuraSciPL/aurasci-pl
git init && git branch -m main
git add .
git commit -m "feat: AuraSci PL Hackathon"
git remote add origin https://github.com/1vayou/AuraSci-PL.git
git push -u origin main
```

When prompted for password → use a GitHub Personal Access Token:
1. Go to https://github.com/settings/tokens/new
2. Note: "AuraSci Deploy"
3. Check "repo" scope → Generate
4. Copy token → paste as password

## Step 3: Connect to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `AuraSci-PL`
4. Framework: Next.js (auto-detected)
5. Add Environment Variables:
   - `STORACHA_SPACE_DID` = `did:key:z6MktDavuL1M2VdtHe2nVnhCaD8CiTmchWmyn8x2sEPbfvey`
   - `X402_FACILITATOR_URL` = `https://x402.org/facilitator`
   - `X402_PAY_TO` = your Base Sepolia wallet address (receives USDC payments)
6. Click Deploy!

## Step 4: Done! 🎉
Vercel gives you a live URL like `aurasci-pl.vercel.app`

---

## What's been built:
- ✅ IPFS/Storacha integration (your space DID embedded)
- ✅ ERC-8004 Identity + Reputation + Validation Registry (Solidity)
- ✅ ERC-8183 Escrow smart contract (Solidity)
- ✅ x402 HTTP 402 micropayment (real @x402/core + @x402/evm, facilitator-verified on Base Sepolia)
- ✅ Full scientist + patron flow
- ✅ IPFS uploader component (real uploads when token added)
- ✅ Live protocol activity feed
- ✅ Agent registration flow (agent.json pinned to IPFS)
