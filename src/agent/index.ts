import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
  WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { pharosDevnet } from "../network/network";
import {
  fetchPrices,
  get_erc20_balance,
  get_erc721_balance,
  getElfaAiApiKeyStatus,
  getLatestPools,
  getProtocolTvl,
  getSmartMentions,
  getSmartTwitterAccountStats,
  getTokenPriceData,
  getTopGainers,
  getTopMentionsByTicker,
  getTrendingPools,
  getTrendingTokens,
  getTrendingTokensUsingElfaAi,
  pingElfaAiApi,
  searchMentionsByKeywords,
  transfer,
  erc721Mint,
  erc721Transfer,
  getTokenDataByTicker,
} from "../tools";
import { rwaYieldOptimizer } from "../tools/rwa_yield_optimizer";
import type { YieldOptimizerResult } from "../tools/rwa_yield_optimizer";
import { DEFILLAMA_NETWORK_MAPPING } from "../tools/defillama/constants";
import { Config } from "../types";
import { PharosWalletProvider, ViemWalletProvider } from "../wallet-providers";

/**
 * Main class for interacting with Pharos blockchain
 * Provides a unified interface for token operations, NFT management, trading and more
 *
 * @class PharosAgentKit
 * @property {PublicClient} connection - Pharos RPC connection
 * @property {PharosWalletProvider} wallet - Wallet provider for signing transactions
 * @property {Address} wallet_address - Address of the wallet
 * @property {Config} config - Configuration object
 */
export class PharosAgentKit {
  public connection: PublicClient;
  public publicClient: PublicClient;
  public walletClient: WalletClient;
  public wallet: PharosWalletProvider;
  public wallet_address: Address;
  public config: Config | undefined;
  public rpcUrl: string;
  public privateKey: string;

  constructor(private_key: string, rpc_url: string, config?: Config) {
    this.rpcUrl = rpc_url;
    this.connection = createPublicClient({
      chain: pharosDevnet,
      transport: http(rpc_url),
    });
    this.publicClient = this.connection;
    this.wallet_address = privateKeyToAccount(private_key as Address).address;
    this.privateKey = private_key;

    const account = privateKeyToAccount(process.env.PHAROS_PRIVATE_KEY as Address);

    const client = createWalletClient({
      account,
      chain: pharosDevnet,
      transport: http()
    });
    this.walletClient = client;
    this.wallet = new ViemWalletProvider(client);

    this.config = config;
  }

  async getBalance(token_address?: Address | undefined): Promise<number> {
    const balance = await get_erc20_balance(this, token_address);
    return Number(balance);
  }

  async transfer(to: Address, amount: number, mint?: Address): Promise<string> {
    return transfer(this, amount.toString(), to, mint);
  }

  async fetchTokenPriceByChainId(tokenAddr: string, chainId: number) {
    const chainSlug = DEFILLAMA_NETWORK_MAPPING[chainId];
    const chainTokenIdentifier = `${chainSlug}:${tokenAddr}`;
    return fetchPrices({
      chainTokenAddrStrings: [chainTokenIdentifier],
    });
  }

  async fetchTokenPriceByChainSlug(tokenAddr: string, chainSlug: string) {
    const chainTokenIdentifier = `${chainSlug}:${tokenAddr}`;
    return fetchPrices({
      chainTokenAddrStrings: [chainTokenIdentifier],
    });
  }

  async fetchTokenPrices(chainTokenIdentifiers: string[]) {
    return fetchPrices({
      chainTokenAddrStrings: chainTokenIdentifiers,
    });
  }

  async fetchProtocolTvl(slug: string): Promise<string> {
    return getProtocolTvl(slug);
  }

  async getCoingeckoLatestPools() {
    return await getLatestPools(this);
  }

  async getTokenPriceDataUsingCoingecko(...tokenAddresses: string[]) {
    return await getTokenPriceData(this, tokenAddresses);
  }

  async getTopGainersOnCoingecko(
    duration?: "1h" | "24h" | "7d" | "14d" | "30d" | "60d" | "1y",
    noOfCoins?: 300 | 500 | 1000 | "all",
  ) {
    return await getTopGainers(this, duration, noOfCoins);
  }

  async getCoingeckoTrendingPools(duration?: "5m" | "1h" | "24h" | "6h") {
    return await getTrendingPools(this, duration);
  }

  async getTrendingTokensOnCoingecko() {
    return await getTrendingTokens(this);
  }

  async getTrendingTokens(): Promise<any> {
    const response = await getTrendingTokens(this);
    return response;
  }

  async getTrendingTokensUsingElfaAi(): Promise<any> {
    const response = await getTrendingTokensUsingElfaAi(this);
    return response;
  }

  async pingElfaAiApi(): Promise<any> {
    const response = await pingElfaAiApi(this);
    return response;
  }

  async getElfaAiApiKeyStatus(): Promise<any> {
    const response = await getElfaAiApiKeyStatus(this);
    return response;
  }

  async getSmartMentions(
    limit: number = 100,
    offset: number = 0,
  ): Promise<any> {
    const response = await getSmartMentions(this, limit, offset);
    return response;
  }

  async getSmartTwitterAccountStats(username: string): Promise<any> {
    const response = await getSmartTwitterAccountStats(this, username);
    return response;
  }

  async getTopMentionsByTicker(
    ticker: string,
    timeWindow: string = "1h",
    page: number = 1,
    pageSize: number = 10,
    includeAccountDetails: boolean = false,
  ): Promise<any> {
    const response = await getTopMentionsByTicker(
      this,
      ticker,
      timeWindow,
      page,
      pageSize,
      includeAccountDetails,
    );
    return response;
  }

  async searchMentionsByKeywords(
    keywords: string,
    from: number,
    to: number,
    limit: number = 20,
  ): Promise<any> {
    const response = await searchMentionsByKeywords(
      this,
      keywords,
      from,
      to,
      limit,
    );
    return response;
  }

  async getERC721Balance(token_address: Address): Promise<string> {
    const balance = await get_erc721_balance(this, token_address);
    return balance;
  }

  async transferERC721(
    to: Address,
    amount: number,
    tokenAddress: Address,
    tokenId: string
  ): Promise<string> {
    return erc721Transfer(this, BigInt(amount), to, tokenAddress, BigInt(tokenId));
  }

  async mintERC721(
    to: Address,
    tokenAddress: Address,
    tokenId: bigint
  ): Promise<string> {
    return erc721Mint(this, to, tokenAddress, tokenId);
  }

  async rwaYieldOptimize(
    walletAddress: Address,
    reinvestBps = 10000,
    vaultKeys?: Array<"PALPHA_HIGH_YIELD"|"ELFI_RWA_SUPPLY"|"MORPHO_RWA_VAULT">,
    poolKey?: "PROS_USDC_V3"|"PROS_USDT_PMM"|"PROS_ETH_V2"|"USDC_USDT_PMM",
    yieldTokenAddress?: Address,
    previewOnly = false,
    network: "ATLANTIC_TESTNET"|"PACIFIC_MAINNET" = "PACIFIC_MAINNET",
  ): Promise<YieldOptimizerResult> {
    return rwaYieldOptimizer(this, walletAddress, reinvestBps, vaultKeys, poolKey, yieldTokenAddress, previewOnly, network);
  }
  async getTokenDataByTicker(
    ticker: string,
  ): Promise<any | undefined> {
    return getTokenDataByTicker(ticker);
  }
}
