/**
 * Facilitator Layer - Handles payment execution, verification, and settlement
 * 
 * This layer is responsible for:
 * - Executing payments on the blockchain
 * - Verifying payment transactions
 * - Communicating payment completion to X402 servers
 * - Managing network configurations and gas estimation
 */

import { ethers } from 'ethers';
import { NetworkConfig, PaymentRequirement, PaymentPayload, VerificationResponse, SettlementResponse } from '../types/index.js';

export { PaymentFacilitator } from './payment.js';
export { SettlementHandler } from './settlement.js';

// Re-export types for convenience
export type {
  PaymentRequirement,
  PaymentPayload,
  VerificationResponse,
  SettlementResponse
} from '../types/index.js';

/**
 * Default facilitator configuration for Somnia Testnet
 */
export const SOMNIA_TESTNET_CONFIG = {
  chainId: 50312,
  name: 'Somnia Testnet',
  rpcUrl: 'https://dream-rpc.somnia.network',
  currency: 'STT',
  explorer: 'https://shannon-explorer.somnia.network/'
};

/**
 * Create a pre-configured facilitator for Somnia Testnet
 */
export function createSomniaFacilitator() {
  return new PaymentFacilitator(undefined, SOMNIA_TESTNET_CONFIG);
}

/**
 * Create a settlement handler with default configuration
 */
export function createSettlementHandler(options?: {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}) {
  return new SettlementHandler(options);
}