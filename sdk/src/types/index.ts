/**
 * X402 SDK Type Definitions
 * 
 * This module exports all type definitions used throughout the X402 SDK,
 * including network configurations, payment types, and protocol interfaces.
 */

// Network types
export * from './network';

// Payment types
export * from './payment';

// Protocol types
export * from './protocol';

// SDK configuration types
export interface X402SDKConfig {
  /** Default network to use */
  defaultNetwork: import('./network').NetworkName;
  /** Default payment configuration */
  defaultPayment?: Partial<import('./payment').PaymentRequest>;
  /** Spending limits */
  spendingLimits?: import('./payment').SpendingLimit;
  /** Transaction configuration */
  transactionConfig?: import('./network').TransactionConfig;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom RPC URLs for networks */
  customRpcUrls?: Partial<Record<import('./network').NetworkName, string>>;
}

// Wallet types
export interface WalletConfig {
  /** Private key for signing transactions */
  privateKey?: string;
  /** Mnemonic phrase for wallet generation */
  mnemonic?: string;
  /** External signer (for browser wallets) */
  externalSigner?: any;
  /** Wallet type */
  type: 'private_key' | 'mnemonic' | 'external';
}

// Service discovery types
export interface ServiceDiscoveryConfig {
  /** Marketplace URL (e.g., Bazaar) */
  marketplaceUrl?: string;
  /** Service categories to search */
  categories?: string[];
  /** Maximum price per request */
  maxPrice?: string;
  /** Preferred networks */
  preferredNetworks?: import('./network').NetworkName[];
  /** Preferred tokens */
  preferredTokens?: string[];
}

export interface DiscoveredService {
  /** Service identifier */
  id: string;
  /** Service configuration */
  config: import('./protocol').X402ServiceConfig;
  /** Service rating/score */
  rating?: number;
  /** Service availability */
  available: boolean;
  /** Last updated timestamp */
  lastUpdated: number;
}