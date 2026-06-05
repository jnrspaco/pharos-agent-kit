export const PHAROS_NETWORKS = {
  ATLANTIC_TESTNET: {
    chainId: 688688,
    name: "Pharos Atlantic Testnet",
    rpc: "https://rpc.atlanticocean.pharosnetwork.xyz",
    explorer: "https://testnet.pharosscan.xyz",
    currency: "PHRS",
  },
  PACIFIC_MAINNET: {
    chainId: 1672,
    name: "Pharos Pacific Mainnet",
    rpc: "https://rpc.pharosnetwork.xyz",
    explorer: "https://pharosscan.xyz",
    currency: "PROS",
  },
} as const;

export const REALFI_VAULTS = {
  PALPHA_HIGH_YIELD: {
    address: "0x0000000000000000000000000000000000000001" as `0x${string}`,
    name: "pAlpha High Yield RWA Vault",
    protocol: "pAlpha",
    yieldToken: "PROS",
  },
  ELFI_RWA_SUPPLY: {
    address: "0x0000000000000000000000000000000000000002" as `0x${string}`,
    name: "ELFi RWA Supply Pool",
    protocol: "ELFi",
    yieldToken: "PROS",
  },
  MORPHO_RWA_VAULT: {
    address: "0x0000000000000000000000000000000000000003" as `0x${string}`,
    name: "Morpho RWA Vault",
    protocol: "Morpho",
    yieldToken: "PROS",
  },
} as const;

export const FAROSWAP_POOLS = {
  PROS_USDC_V3: {
    address: "0x0000000000000000000000000000000000000010" as `0x${string}`,
    name: "FaroSwap PROS/USDC AMM v3",
    token0: "PROS",
    token1: "USDC",
    poolType: "AMM_V3" as const,
  },
  PROS_USDT_PMM: {
    address: "0x0000000000000000000000000000000000000011" as `0x${string}`,
    name: "FaroSwap PROS/USDT PMM",
    token0: "PROS",
    token1: "USDT",
    poolType: "PMM" as const,
  },
  PROS_ETH_V2: {
    address: "0x0000000000000000000000000000000000000012" as `0x${string}`,
    name: "FaroSwap PROS/ETH AMM v2",
    token0: "PROS",
    token1: "WETH",
    poolType: "AMM_V2" as const,
  },
  USDC_USDT_PMM: {
    address: "0x0000000000000000000000000000000000000013" as `0x${string}`,
    name: "FaroSwap USDC/USDT PMM",
    token0: "USDC",
    token1: "USDT",
    poolType: "PMM" as const,
  },
} as const;

export const PHAROS_TOKENS = {
  PROS: {
    address: "0x0000000000000000000000000000000000000020" as `0x${string}`,
    symbol: "PROS",
    decimals: 18,
  },
  USDC: {
    address: "0x0000000000000000000000000000000000000021" as `0x${string}`,
    symbol: "USDC",
    decimals: 6,
  },
} as const;

export const VAULT_ABI = [
  { name: "pendingRewards", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "amount", type: "uint256" }] },
  { name: "claimRewards", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "account", type: "address" }], outputs: [] },
  { name: "balanceOf", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }] },
  { name: "getRewardApr", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ name: "aprBps", type: "uint256" }] },
] as const;

export const FAROSWAP_POOL_ABI = [
  { name: "getVaultReserve", type: "function", stateMutability: "view",
    inputs: [],
    outputs: [{ name: "baseReserve", type: "uint256" }, { name: "quoteReserve", type: "uint256" }] },
  { name: "buyShares", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [{ name: "shares", type: "uint256" }, { name: "baseInput", type: "uint256" }, { name: "quoteInput", type: "uint256" }] },
] as const;

export const ERC20_ABI = [
  { name: "decimals", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }] },
  { name: "transfer", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }] },
] as const;
