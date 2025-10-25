// Core X402 Protocol Types
export interface PaymentRequirement {
  scheme: string;
  network: string;
  token: string;
  amount: string;
  payTo: string;
  nonce?: string;
  expiry?: number;
  extras?: Record<string, any>;
}

export interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentRequirement[];
  message?: string;
}

export interface PaymentPayload {
  scheme: string;
  network: string;
  token: string;
  amount: string;
  payTo: string;
  nonce: string;
  signature: string;
  from: string;
  timestamp: number;
  txHash?: string;
}

export interface VerificationResponse {
  valid: boolean;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  error?: string;
}

export interface SettlementResponse {
  success: boolean;
  statusCode?: number;
  data?: any;
  headers?: Record<string, string>;
  error?: string;
}

export interface SettlementResponse {
  settled: boolean;
  txHash: string;
  blockNumber?: number;
  timestamp: number;
}

// Wallet Types
export interface WalletConfig {
  address: string;
  encryptedPrivateKey: string;
  network: string;
  createdAt: number;
}

export interface SpendingLimit {
  perTransaction?: number;
  daily?: number;
  spent?: number;
}

export interface SpendingRecord {
  amount: string;
  timestamp: number;
  txHash?: string;
  service: string;
}

// Discovery Types
export interface ServiceInfo {
  name: string;
  description: string;
  endpoint: string;
  pricing: PaymentRequirement[];
  category: string;
  rating?: number;
  verified?: boolean;
}

export interface DiscoveryQuery {
  query?: string;
  category?: string;
  maxPrice?: string;
  network?: string;
  limit?: number;
}

export interface DiscoveryConfig {
  registryUrl: string;
  cacheTimeout: number;
  maxResults: number;
  timeout: number;
  enableCache: boolean;
}

// Network Configuration
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  currency: string;
  explorer: string;
  testnet: boolean;
}

// SDK Configuration
export interface SDKConfig {
  network: NetworkConfig;
  facilitatorUrl?: string;
  discoveryUrl?: string;
  defaultSpendingLimit?: string;
  autoSettle?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

export interface X402Config {
  network: NetworkConfig;
  facilitatorUrl?: string;
  discoveryUrl?: string;
  defaultSpendingLimit?: string;
  autoSettle?: boolean;
}

// Error Types
export class X402Error extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'X402Error';
  }
}

export enum X402ErrorCode {
  INVALID_PAYMENT_RESPONSE = 'INVALID_PAYMENT_RESPONSE',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  SPENDING_LIMIT_EXCEEDED = 'SPENDING_LIMIT_EXCEEDED',
  PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  UNSUPPORTED_NETWORK = 'UNSUPPORTED_NETWORK',
  UNSUPPORTED_SCHEME = 'UNSUPPORTED_SCHEME',
  NETWORK_ERROR = 'NETWORK_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  DISCOVERY_ERROR = 'DISCOVERY_ERROR'
}