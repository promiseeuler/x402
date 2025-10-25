/**
 * Network configuration types for X402 SDK
 * Supports multiple EVM-compatible chains including Ethereum, Base, and Somnia
 */

export type NetworkName = 
  | 'ETHEREUM_MAINNET'
  | 'ETHEREUM_SEPOLIA'
  | 'BASE_MAINNET'
  | 'BASE_SEPOLIA'
  | 'SOMNIA_TESTNET'
  | 'POLYGON_MAINNET'
  | 'ARBITRUM_MAINNET';

export interface NetworkConfig {
  /** Human-readable network name */
  name: string;
  /** Chain ID as number */
  chainId: number;
  /** Chain ID as hex string */
  chainIdHex: string;
  /** RPC endpoint URL */
  rpcUrl: string;
  /** Block explorer base URL */
  explorerUrl: string;
  /** Native token configuration */
  nativeToken: TokenConfig;
  /** Supported payment tokens */
  supportedTokens: TokenConfig[];
  /** Whether this is a testnet */
  isTestnet: boolean;
}

export interface TokenConfig {
  /** Token symbol (e.g., 'ETH', 'USDC', 'STT') */
  symbol: string;
  /** Token name */
  name: string;
  /** Number of decimal places */
  decimals: number;
  /** Contract address (undefined for native tokens) */
  address?: string;
  /** Token logo URL */
  logoUrl?: string;
  /** Whether this is the native token */
  isNative: boolean;
}

export interface PaymentConfig {
  /** Network to use for payments */
  network: NetworkName;
  /** Token to use for payments */
  token: string; // Token symbol
  /** Maximum amount willing to spend per request */
  maxPricePerRequest: string;
  /** Maximum total spending limit */
  maxTotalSpending?: string;
  /** Spending time window in seconds */
  spendingWindow?: number;
}

export interface TransactionConfig {
  /** Gas limit for transactions */
  gasLimit?: number;
  /** Gas price in wei (for legacy transactions) */
  gasPrice?: string;
  /** Max fee per gas for EIP-1559 transactions */
  maxFeePerGas?: string;
  /** Max priority fee per gas for EIP-1559 transactions */
  maxPriorityFeePerGas?: string;
  /** Transaction timeout in milliseconds */
  timeout?: number;
}

export interface NetworkError {
  code: string;
  message: string;
  network?: NetworkName;
  chainId?: number;
}

/**
 * Standard error codes for network operations
 */
export enum NetworkErrorCode {
  UNSUPPORTED_NETWORK = 'UNSUPPORTED_NETWORK',
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  INVALID_CHAIN_ID = 'INVALID_CHAIN_ID',
  RPC_ERROR = 'RPC_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED'
}