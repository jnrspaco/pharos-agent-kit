import { Tool } from "@langchain/core/tools";
import { PharosAgentKit } from "../../agent";
import { REALFI_VAULTS, FAROSWAP_POOLS } from "../../constants/pharos";

export class RWAYieldOptimizerTool extends Tool {
  name = "rwa_yield_optimizer";
  description = `Scans pAlpha, ELFi, and Morpho RealFi vaults for pending yield, ranks FaroSwap pools by live APY, claims all yield in parallel, and reinvests into the best pool. Inputs (JSON): walletAddress (required), reinvestBps 0-10000 (default 10000), previewOnly bool (default false), vaultKeys string[] (optional), poolKey string (optional), network "ATLANTIC_TESTNET"|"PACIFIC_MAINNET" (default mainnet).`;
  constructor(private agent: PharosAgentKit) { super(); }
  protected async _call(input: string): Promise<string> {
    try {
      const p = JSON.parse(input);
      if (!p.walletAddress) throw new Error("walletAddress is required");
      if (p.vaultKeys) {
        const valid = Object.keys(REALFI_VAULTS);
        for (const k of p.vaultKeys) if (!valid.includes(k)) throw new Error(`Invalid vaultKey: ${k}`);
      }
      if (p.poolKey && !Object.keys(FAROSWAP_POOLS).includes(p.poolKey)) throw new Error(`Invalid poolKey: ${p.poolKey}`);
      const { rwaYieldOptimizer } = await import("../../tools/rwa_yield_optimizer/rwa_yield_optimizer");
      const result = await rwaYieldOptimizer(this.agent, p.walletAddress, p.reinvestBps ?? 10000, p.vaultKeys, p.poolKey, p.yieldTokenAddress, p.previewOnly ?? false, p.network ?? "PACIFIC_MAINNET");
      return JSON.stringify({ status: "success", data: result });
    } catch (e: unknown) {
      return JSON.stringify({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }
}
