// Demo script — runs with mock data, no real txs
const vaults = [
  { protocol: "pAlpha", name: "pAlpha High Yield RWA Vault", pending: "120.5000", apr: "9.20%" },
  { protocol: "ELFi", name: "ELFi RWA Supply Pool", pending: "45.2500", apr: "7.50%" },
  { protocol: "Morpho", name: "Morpho RWA Vault", pending: "0.0000", apr: "0.00%" },
];
const bestPool = { name: "FaroSwap PROS/USDT PMM", apy: 12.5, type: "PMM" };
const total = 165.75;
const reinvest = total;
const keep = 0;
const annual = (reinvest * bestPool.apy / 100).toFixed(4);

console.log(`
╔═══════════════════════════════════════════════════════╗
║  RWA YIELD OPTIMIZER — PREVIEW (no txs sent)          ║
╚═══════════════════════════════════════════════════════╝
── Vault scan ──────────────────────────────────────────`);
vaults.forEach(v => {
  const val = parseFloat(v.pending).toFixed(4).padStart(12);
  console.log(`  • ${v.protocol.padEnd(10)} ${v.name.padEnd(34)} Pending: ${val} PROS  APR: ${v.apr}`);
});
console.log(`   TOTAL: ${total.toFixed(6)} PROS

── Best pool (FaroSwap) ────────────────────────────────
  🥇 ${bestPool.name} — ${bestPool.apy.toFixed(2)}% APY [${bestPool.type}] ← AUTO-SELECTED

── Split ───────────────────────────────────────────────
   Reinvest: ${reinvest.toFixed(6)} PROS → ${bestPool.name}
   Keep:     ${keep.toFixed(6)} PROS  (stays in wallet)

── Projections ─────────────────────────────────────────
   Annual gain: ${annual} PROS at ${bestPool.apy.toFixed(2)}% APY
   Est. gas:    ~0.00000192 ETH

   ℹ️  Set previewOnly=false to execute.
`);
