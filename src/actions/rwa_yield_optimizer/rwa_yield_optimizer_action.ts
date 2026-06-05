import { z } from "zod";
import { PharosAgentKit } from "../../agent";
import { rwaYieldOptimizer } from "../../tools/rwa_yield_optimizer/rwa_yield_optimizer";

export const rwaYieldOptimizerAction = {
  name: "RWA_YIELD_OPTIMIZER",
  similes: ["scan realfi vaults","check my rwa yield","claim and reinvest","auto compound pharos yield","claim palpha yield","claim elfi rewards","preview realfi positions","scan claim and reinvest all pharos yield"],
  description: "Scans all Pharos RealFi vaults (pAlpha, ELFi, Morpho), ranks FaroSwap pools by APY, claims yield in parallel, reinvests into the best pool.",
  examples: [[{
    input: { walletAddress: "0xYourWallet", previewOnly: true },
    output: { status: "success", data: { executed: false, preview: { totalPendingYield: "165.75" } } },
    explanation: "Preview mode — shows vault positions and APY rankings without executing any txs.",
  }]],
  schema: z.object({
    walletAddress: z.string().describe("Wallet to scan and claim yield for"),
    reinvestBps: z.number().min(0).max(10000).default(10000).describe("Basis points to reinvest (0=keep all, 10000=compound all)"),
    vaultKeys: z.array(z.enum(["PALPHA_HIGH_YIELD","ELFI_RWA_SUPPLY","MORPHO_RWA_VAULT"])).optional(),
    poolKey: z.enum(["PROS_USDC_V3","PROS_USDT_PMM","PROS_ETH_V2","USDC_USDT_PMM"]).optional(),
    yieldTokenAddress: z.string().optional(),
    previewOnly: z.boolean().default(false).describe("Return forecast without executing txs"),
    network: z.enum(["ATLANTIC_TESTNET","PACIFIC_MAINNET"]).default("PACIFIC_MAINNET"),
  }),
  handler: async (agent: PharosAgentKit, input: Record<string, any>) => {
    const result = await rwaYieldOptimizer(agent, input.walletAddress, input.reinvestBps ?? 10000, input.vaultKeys, input.poolKey, input.yieldTokenAddress, input.previewOnly ?? false, input.network ?? "PACIFIC_MAINNET");
    return { status: "success", data: result, message: result.finalSummary };
  },
};
