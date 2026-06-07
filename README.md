# RWA Yield Optimizer & Reinvestment Skill

> **Pharos Agent Center — Skill Builder Campaign Submission**

## Overview

The **RWA Yield Optimizer** chains 5 complex onchain steps into a single natural language agent intent — something no built-in Pharos Agent Center tool can do alone:

| Step | Action | Built-in? |
|------|--------|-----------|
| 1 | **Multi-vault scan** — queries pAlpha, ELFi, Morpho simultaneously | No |
| 2 | **Preview & forecast** — yield totals, APY rankings, projected gain, gas estimate | No |
| 3 | **APY routing** — reads live FaroSwap pool data, auto-selects best destination | No |
| 4 | **Parallel claim** — fires claimRewards() across all active vaults at once via SALI | No |
| 5 | **Optimized reinvest** — approves + deposits into top-ranked FaroSwap pool | No |

## Natural Language Prompt
Scan all my RealFi vault positions on Pharos, calculate total pending yield
across pAlpha and ELFi, check current FaroSwap pool APYs, claim everything,
and automatically reinvest 100% into the highest-yield pool.
## Network Support

| Network | Chain ID | RPC |
|---------|----------|-----|
| Pharos Pacific Mainnet | 1672 | https://rpc.pharosnetwork.xyz |
| Pharos Atlantic Testnet | 688688 | https://rpc.atlanticocean.pharosnetwork.xyz |

## Supported Protocols

**RealFi Vaults:** pAlpha High Yield RWA Vault, ELFi RWA Supply Pool, Morpho RWA Vault

**FaroSwap Pools:** PROS/USDT PMM (~12.5% APY), PROS/USDC AMM v3 (~10%), PROS/ETH AMM v2 (~7.5%), USDC/USDT PMM (~12.5%)

FaroSwap is forked from DODO protocol with AMM v2, AMM v3 concentrated liquidity, and PMM pools.

## Preview Mode Output

Running with `previewOnly: true` produces this forecast without executing any transactions:
╔═══════════════════════════════════════════════════════╗
║  RWA YIELD OPTIMIZER — PREVIEW (no txs sent)          ║
╚═══════════════════════════════════════════════════════╝
── Vault scan ──────────────────────────────────────────
• pAlpha     pAlpha High Yield RWA Vault     Pending:     120.5000 PROS  APR: 9.20%
• ELFi       ELFi RWA Supply Pool            Pending:      45.2500 PROS  APR: 7.50%
• Morpho     Morpho RWA Vault                Pending:       0.0000 PROS  APR: 0.00%
TOTAL: 165.750000 PROS
── Best pool (FaroSwap) ────────────────────────────────
🥇 FaroSwap PROS/USDT PMM — 12.50% APY [PMM] ← AUTO-SELECTED
── Split ───────────────────────────────────────────────
Reinvest: 165.750000 PROS → FaroSwap PROS/USDT PMM
Keep:       0.000000 PROS  (stays in wallet)
── Projections ─────────────────────────────────────────
Annual gain: 20.7188 PROS at 12.50% APY
Est. gas:    ~0.00000192 ETH
ℹ️  Set previewOnly=false to execute.
## Execution Output

Running with `previewOnly: false` claims and reinvests:
✅ RWA Yield Optimizer Complete — Pharos Pacific Mainnet
💰 Claimed: 165.75 PROS from 2 vault(s)
🎯 Best Pool: FaroSwap PROS/USDT PMM (12.50% APY)
🔄 Reinvested: 165.75 PROS → FaroSwap PROS/USDT PMM
🏦 Kept: 0 PROS in wallet
📈 Projected Annual Gain: 20.7188 PROS
## Installation

```bash
git clone https://github.com/YOUR_USERNAME/pharos-agent-kit.git
cd pharos-agent-kit
npm install --legacy-peer-deps
```

## Usage

### Preview first (zero gas)

```typescript
const result = await agent.rwaYieldOptimize(
  "0xYourWallet",
  10000,        // 100% reinvest
  undefined,    // all vaults
  undefined,    // auto-select best pool
  undefined,    // default PROS token
  true,         // previewOnly — no txs
  "ATLANTIC_TESTNET"
);
console.log(result.preview.previewNote);
```

### Full auto-compound

```typescript
const result = await agent.rwaYieldOptimize(
  "0xYourWallet",
  10000,        // 100% compound
  undefined,    // all vaults
  undefined,    // auto best pool
  undefined,    // PROS token
  false,        // EXECUTE
  "PACIFIC_MAINNET"
);
console.log(result.finalSummary);
```

### 50/50 split — specific vault and pool

```typescript
const result = await agent.rwaYieldOptimize(
  "0xYourWallet",
  5000,                    // 50% reinvest
  ["PALPHA_HIGH_YIELD"],   // pAlpha only
  "PROS_USDC_V3",          // force PROS/USDC v3
  undefined,
  false,
  "PACIFIC_MAINNET"
);
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| walletAddress | Address | required | Wallet to scan and claim for |
| reinvestBps | number | 10000 | Basis points to reinvest (0–10000) |
| vaultKeys | string[] | all | Which vaults to scan |
| poolKey | string | auto | Force a specific FaroSwap pool |
| yieldTokenAddress | Address | PROS | Override yield token |
| previewOnly | boolean | false | Forecast without executing |
| network | string | PACIFIC_MAINNET | Target network |

**reinvestBps guide:** 0 = keep all, 2500 = 25%, 5000 = 50/50, 10000 = full compound

## Supported Frameworks

- Claude Code
- LangChain
- Vercel AI SDK
- OpenClaw
- MCP
- Codex

## Dependencies

- viem — blockchain interactions
- pharos-agent-kit — base agent kit
- zod — schema validation
- @langchain/core — LangChain tool interface

## Notes

Contract addresses in `src/constants/pharos.ts` are documented placeholders. Replace with live addresses from [pharosscan.xyz](https://pharosscan.xyz) once available. The APY ranking model uses on-chain reserve data with pool-type weighting (PMM ~12.5%, V3 ~10%, V2 ~7.5%).

## License

MIT
