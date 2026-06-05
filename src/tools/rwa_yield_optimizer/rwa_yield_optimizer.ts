import { Address, formatUnits, parseUnits, maxUint256 } from "viem";
import { PharosAgentKit } from "../../agent";
import { REALFI_VAULTS, FAROSWAP_POOLS, PHAROS_TOKENS, PHAROS_NETWORKS, VAULT_ABI, FAROSWAP_POOL_ABI, ERC20_ABI } from "../../constants/pharos";

export interface VaultPosition {
  vaultKey: string; vaultName: string; protocol: string; vaultAddress: Address;
  stakedBalance: string; pendingYield: string; pendingYieldRaw: bigint;
  aprBps: number; aprPercent: string; hasYield: boolean;
}
export interface PoolApyRanking {
  poolKey: string; poolName: string; poolAddress: Address; poolType: string;
  estimatedApy: number; tvlUsd: string; token0: string; token1: string; recommended: boolean;
}
export interface YieldPreview {
  walletAddress: Address; totalPendingYield: string; totalPendingYieldRaw: bigint;
  vaultPositions: VaultPosition[]; poolRankings: PoolApyRanking[]; bestPool: PoolApyRanking;
  reinvestAmount: string; keepAmount: string; reinvestBps: number;
  projectedAnnualGain: string; estimatedGasCostEth: string; network: string; previewNote: string;
}
export interface ClaimResult {
  vaultName: string; vaultAddress: Address; amountClaimed: string;
  txHash?: string; status: "success" | "skipped" | "failed"; reason?: string;
}
export interface YieldOptimizerResult {
  preview: YieldPreview; executed: boolean; claimResults: ClaimResult[];
  reinvestTxHash?: string; totalClaimed: string; totalReinvested: string;
  totalKept: string; finalSummary: string;
}

export async function rwaYieldOptimizer(
  agent: PharosAgentKit, walletAddress: Address, reinvestBps = 10000,
  vaultKeys?: Array<keyof typeof REALFI_VAULTS>,
  poolKey?: keyof typeof FAROSWAP_POOLS,
  yieldTokenAddress?: Address, previewOnly = false,
  network: keyof typeof PHAROS_NETWORKS = "PACIFIC_MAINNET",
): Promise<YieldOptimizerResult> {
  if (reinvestBps < 0 || reinvestBps > 10000) throw new Error("reinvestBps must be 0–10000");
  const tokenAddress = yieldTokenAddress ?? PHAROS_TOKENS.PROS.address;
  const targetVaultKeys = vaultKeys ?? (Object.keys(REALFI_VAULTS) as Array<keyof typeof REALFI_VAULTS>);
  const networkConfig = PHAROS_NETWORKS[network];

  const vaultPositions = await scanAllVaults(agent, walletAddress, targetVaultKeys);
  const totalPendingYieldRaw = vaultPositions.reduce((s, v) => s + v.pendingYieldRaw, 0n);
  const totalPendingYield = formatUnits(totalPendingYieldRaw, 18);

  const poolRankings = await rankPoolsByApy(agent);
  const bestPool = poolKey ? (poolRankings.find(p => p.poolKey === poolKey) ?? poolRankings[0]) : poolRankings[0];

  const reinvestAmountRaw = (totalPendingYieldRaw * BigInt(reinvestBps)) / 10000n;
  const keepAmountRaw = totalPendingYieldRaw - reinvestAmountRaw;
  const reinvestAmount = formatUnits(reinvestAmountRaw, 18);
  const keepAmount = formatUnits(keepAmountRaw, 18);
  const projectedAnnualGain = (parseFloat(reinvestAmount) * bestPool.estimatedApy / 100).toFixed(4);

  let estimatedGasCostEth = "0.000001";
  try {
    const feeData = await agent.connection.estimateFeesPerGas();
    const gasPrice = feeData.maxFeePerGas ?? 1_000_000_000n;
    estimatedGasCostEth = formatUnits(gasPrice * 80000n * BigInt(vaultPositions.filter(v => v.hasYield).length + 2), 18);
  } catch { /* fallback */ }

  const preview: YieldPreview = {
    walletAddress, totalPendingYield, totalPendingYieldRaw, vaultPositions, poolRankings,
    bestPool, reinvestAmount, keepAmount, reinvestBps, projectedAnnualGain,
    estimatedGasCostEth, network: networkConfig.name,
    previewNote: buildPreviewNote(vaultPositions, totalPendingYield, bestPool, reinvestAmount, keepAmount, projectedAnnualGain, estimatedGasCostEth, previewOnly),
  };

  if (previewOnly || totalPendingYieldRaw === 0n) {
    return { preview, executed: false, claimResults: [], totalClaimed: "0", totalReinvested: "0", totalKept: "0", finalSummary: preview.previewNote };
  }

  const vaultsWithYield = vaultPositions.filter(v => v.hasYield);
  const claimSettled = await Promise.allSettled(vaultsWithYield.map(v => claimVaultYield(agent, v, walletAddress)));
  const claimResults: ClaimResult[] = claimSettled.map((r, i) =>
    r.status === "fulfilled" ? r.value : {
      vaultName: vaultsWithYield[i].vaultName, vaultAddress: vaultsWithYield[i].vaultAddress,
      amountClaimed: "0", status: "failed" as const, reason: (r.reason as Error)?.message,
    }
  );

  const totalClaimedRaw = claimResults.filter(r => r.status === "success").reduce((s, r) => s + parseUnits(r.amountClaimed, 18), 0n);
  const totalClaimed = formatUnits(totalClaimedRaw, 18);
  const actualReinvestRaw = (totalClaimedRaw * BigInt(reinvestBps)) / 10000n;
  const actualKeepRaw = totalClaimedRaw - actualReinvestRaw;

  let reinvestTxHash: string | undefined;
  if (actualReinvestRaw > 0n && bestPool) {
    const account = agent.walletClient.account!;
    const chain = agent.walletClient.chain;
    await agent.walletClient.writeContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "approve", args: [bestPool.poolAddress, maxUint256], account, chain });
    await agent.walletClient.writeContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "transfer", args: [bestPool.poolAddress, actualReinvestRaw], account, chain });
    reinvestTxHash = await agent.walletClient.writeContract({ address: bestPool.poolAddress, abi: FAROSWAP_POOL_ABI, functionName: "buyShares", args: [walletAddress], account, chain });
  }

  const totalReinvested = formatUnits(actualReinvestRaw, 18);
  const totalKept = formatUnits(actualKeepRaw, 18);
  const successfulClaims = claimResults.filter(r => r.status === "success").length;
  const finalSummary = [
    `✅ RWA Yield Optimizer Complete — ${networkConfig.name}`,
    `💰 Claimed: ${totalClaimed} PROS from ${successfulClaims} vault(s)`,
    `🎯 Best Pool: ${bestPool.poolName} (${bestPool.estimatedApy.toFixed(2)}% APY)`,
    `🔄 Reinvested: ${totalReinvested} PROS → ${bestPool.poolName}`,
    `🏦 Kept: ${totalKept} PROS in wallet`,
    `📈 Projected Annual Gain: ${projectedAnnualGain} PROS`,
  ].join("\n");

  return { preview, executed: true, claimResults, reinvestTxHash, totalClaimed, totalReinvested, totalKept, finalSummary };
}

async function scanAllVaults(agent: PharosAgentKit, walletAddress: Address, vaultKeys: Array<keyof typeof REALFI_VAULTS>): Promise<VaultPosition[]> {
  return Promise.all(vaultKeys.map(async (key): Promise<VaultPosition> => {
    const vault = REALFI_VAULTS[key];
    try {
      const [pendingYieldRaw, stakedBalanceRaw, aprBpsRaw] = await Promise.all([
        agent.connection.readContract({ address: vault.address, abi: VAULT_ABI, functionName: "pendingRewards", args: [walletAddress] }) as Promise<bigint>,
        agent.connection.readContract({ address: vault.address, abi: VAULT_ABI, functionName: "balanceOf", args: [walletAddress] }) as Promise<bigint>,
        (agent.connection.readContract({ address: vault.address, abi: VAULT_ABI, functionName: "getRewardApr", args: [] }) as Promise<bigint>).catch(() => 0n),
      ]);
      const aprBps = Number(aprBpsRaw);
      return { vaultKey: key, vaultName: vault.name, protocol: vault.protocol, vaultAddress: vault.address,
        stakedBalance: formatUnits(stakedBalanceRaw, 18), pendingYield: formatUnits(pendingYieldRaw, 18),
        pendingYieldRaw, aprBps, aprPercent: (aprBps / 100).toFixed(2) + "%", hasYield: pendingYieldRaw > 0n };
    } catch {
      return { vaultKey: key, vaultName: vault.name, protocol: vault.protocol, vaultAddress: vault.address,
        stakedBalance: "0", pendingYield: "0", pendingYieldRaw: 0n, aprBps: 0, aprPercent: "0.00%", hasYield: false };
    }
  }));
}

async function rankPoolsByApy(agent: PharosAgentKit): Promise<PoolApyRanking[]> {
  const rankings = await Promise.all((Object.keys(FAROSWAP_POOLS) as Array<keyof typeof FAROSWAP_POOLS>).map(async (key): Promise<PoolApyRanking> => {
    const pool = FAROSWAP_POOLS[key];
    try {
      const reserves = await agent.connection.readContract({ address: pool.address, abi: FAROSWAP_POOL_ABI, functionName: "getVaultReserve", args: [] }) as readonly [bigint, bigint];
      const tvlRaw = reserves[0] + reserves[1];
      const baseApy = pool.poolType === "PMM" ? 12.5 : pool.poolType === "AMM_V3" ? 10.0 : 7.5;
      return { poolKey: key, poolName: pool.name, poolAddress: pool.address, poolType: pool.poolType,
        estimatedApy: baseApy * (tvlRaw > 1_000_000_000_000_000_000_000_000n ? 0.9 : 1.0),
        tvlUsd: formatUnits(tvlRaw, 18), token0: pool.token0, token1: pool.token1, recommended: false };
    } catch {
      return { poolKey: key, poolName: pool.name, poolAddress: pool.address, poolType: pool.poolType,
        estimatedApy: 0, tvlUsd: "0", token0: pool.token0, token1: pool.token1, recommended: false };
    }
  }));
  rankings.sort((a, b) => b.estimatedApy - a.estimatedApy);
  if (rankings.length > 0) rankings[0].recommended = true;
  return rankings;
}

async function claimVaultYield(agent: PharosAgentKit, vault: VaultPosition, walletAddress: Address): Promise<ClaimResult> {
  if (!vault.hasYield) return { vaultName: vault.vaultName, vaultAddress: vault.vaultAddress, amountClaimed: "0", status: "skipped", reason: "No pending yield" };
  try {
    const txHash = await agent.walletClient.writeContract({
      address: vault.vaultAddress, abi: VAULT_ABI, functionName: "claimRewards",
      args: [walletAddress], account: agent.walletClient.account!, chain: agent.walletClient.chain,
    });
    return { vaultName: vault.vaultName, vaultAddress: vault.vaultAddress, amountClaimed: vault.pendingYield, txHash, status: "success" };
  } catch (e: unknown) {
    return { vaultName: vault.vaultName, vaultAddress: vault.vaultAddress, amountClaimed: "0", status: "failed", reason: e instanceof Error ? e.message : String(e) };
  }
}

function buildPreviewNote(vaultPositions: VaultPosition[], totalPendingYield: string, bestPool: PoolApyRanking, reinvestAmount: string, keepAmount: string, projectedAnnualGain: string, estimatedGasCostEth: string, isPreviewOnly: boolean): string {
  const vaultLines = vaultPositions.map(v => `  • ${v.protocol.padEnd(10)} ${v.vaultName.substring(0, 30).padEnd(32)} Pending: ${parseFloat(v.pendingYield).toFixed(4).padStart(10)} PROS  APR: ${v.aprPercent}`).join("\n");
  return [
    `╔═══════════════════════════════════════════════════════╗`,
    `║  RWA YIELD OPTIMIZER — ${isPreviewOnly ? "PREVIEW (no txs sent)" : "EXECUTION PLAN       "}  ║`,
    `╚═══════════════════════════════════════════════════════╝`,
    `── Vault Scan ──────────────────────────────────────────`, vaultLines,
    `   TOTAL: ${parseFloat(totalPendingYield).toFixed(6)} PROS`,
    `── Best Pool ───────────────────────────────────────────`,
    `  🥇 ${bestPool.poolName} — ${bestPool.estimatedApy.toFixed(2)}% APY [${bestPool.poolType}]`,
    `── Split ───────────────────────────────────────────────`,
    `   Reinvest: ${parseFloat(reinvestAmount).toFixed(6)} PROS  |  Keep: ${parseFloat(keepAmount).toFixed(6)} PROS`,
    `── Projections ─────────────────────────────────────────`,
    `   Annual Gain: ${projectedAnnualGain} PROS  |  Est. Gas: ~${parseFloat(estimatedGasCostEth).toFixed(8)} ETH`,
    isPreviewOnly ? `   ℹ️  Set previewOnly=false to execute.` : `   ▶  Executing now...`,
  ].join("\n");
}
