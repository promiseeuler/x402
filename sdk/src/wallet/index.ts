/**
 * Wallet Layer - Handles user wallet creation, spending limits, and transaction management
 * 
 * This layer provides:
 * - Secure wallet creation and management
 * - Spending limit controls for micropayments
 * - Balance checking for native and ERC-20 tokens
 * - Message and typed data signing capabilities
 * - Transaction history and spending tracking
 */

import { SpendingLimit } from '../types/index.js';
import { X402WalletManager } from './manager.js';

export { X402WalletManager } from './manager.js';

// Re-export types for convenience
export type {
  WalletConfig,
  SpendingLimit,
  NetworkConfig
} from '../types/index.js';

/**
 * Create a wallet manager for Somnia Testnet
 */
export function createSomniaWalletManager() {
  const somniaConfig = {
    chainId: 50312,
    name: 'somnia',
    rpcUrl: 'https://dream-rpc.somnia.network',
    currency: 'STT',
    explorer: 'https://shannon-explorer.somnia.network/',
    testnet: true
  };
  
  return new X402WalletManager(somniaConfig);
}

/**
 * Default spending limits for different use cases
 */
export const DEFAULT_SPENDING_LIMITS = {
  // Conservative limits for new users
  CONSERVATIVE: {
    perTransaction: 0.01, // 0.01 STT per transaction
    daily: 0.1 // 0.1 STT per day
  },
  
  // Moderate limits for regular users
  MODERATE: {
    perTransaction: 0.1, // 0.1 STT per transaction
    daily: 1.0 // 1 STT per day
  },
  
  // Higher limits for power users
  LIBERAL: {
    perTransaction: 1.0, // 1 STT per transaction
    daily: 10.0 // 10 STT per day
  }
};

/**
 * Utility function to create spending limits
 * @param preset - Preset name or custom limits
 * @returns Spending limit configuration
 */
export function createSpendingLimit(
  preset: keyof typeof DEFAULT_SPENDING_LIMITS | SpendingLimit
): SpendingLimit {
  if (typeof preset === 'object') {
    return preset;
  }
  return DEFAULT_SPENDING_LIMITS[preset as keyof typeof DEFAULT_SPENDING_LIMITS];
}