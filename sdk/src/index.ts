/**
 * X402 SDK - Self-hosted payment protocol implementation
 * 
 * A TypeScript SDK for integrating X402 micropayments into applications.
 * Supports Somnia Testnet and other EVM-compatible networks.
 * 
 * @example
 * ```typescript
 * import { createX402SDK } from '@x402/sdk';
 * 
 * const sdk = createX402SDK();
 * 
 * // Create a wallet
 * const wallet = await sdk.createWallet('password123');
 * 
 * // Make a request that may require payment
 * const result = await sdk.request('https://api.example.com/premium-data');
 * 
 * if (result.paymentRequired) {
 *   // Handle payment automatically
 *   const paymentResult = await sdk.handlePayment(result.paymentRequired, 'https://api.example.com/premium-data');
 *   console.log('Payment successful:', paymentResult.data);
 * }
 * ```
 */

// Main SDK exports
export { X402SDK } from './sdk/index.js';

// Core types
export {
  NetworkConfig,
  PaymentRequirement,
  PaymentPayload,
  VerificationResponse,
  SettlementResponse,
  X402Error,
  X402ErrorCode,
  WalletConfig,
  SpendingLimit,
  SDKConfig,
  DiscoveryConfig
} from './types/index.js';

// Protocol layer
export { X402Parser } from './protocol/x402-parser.js';

// Payment facilitator
export { PaymentFacilitator } from './facilitator/payment.js';
export { SettlementHandler } from './facilitator/settlement.js';

// Wallet management
export { X402WalletManager } from './wallet/manager.js';
export { createWallet, getSpendingLimitPreset } from './wallet/index.js';

// Service discovery
export { X402Bazaar } from './discovery/bazaar.js';
export { createDiscoveryClient } from './discovery/index.js';

// Constants and defaults
export const SOMNIA_TESTNET_CONFIG = {
  chainId: 50312,
  name: 'somnia' as const,
  rpcUrl: 'https://dream-rpc.somnia.network',
  currency: 'STT',
  explorer: 'https://shannon-explorer.somnia.network/'
};

export const DEFAULT_SDK_CONFIG = {
  network: SOMNIA_TESTNET_CONFIG,
  autoSettle: true,
  retryAttempts: 3,
  timeout: 30000
};

/**
 * Quick start function for common use cases
 * Creates an SDK instance with a wallet loaded from private key
 * 
 * @param privateKey - Wallet private key (for development/testing)
 * @param config - Optional SDK configuration
 * @returns Configured SDK instance with loaded wallet
 */
export function quickStart(privateKey: string, config: Partial<SDKConfig> = {}) {
  const sdk = createX402SDK(config);
  sdk.loadWalletFromPrivateKey(privateKey);
  return sdk;
}

/**
 * Utility function to check if a response requires payment
 * 
 * @param response - HTTP response to check
 * @returns True if response has 402 status
 */
export function isPaymentRequired(response: { status: number }): boolean {
  return response.status === 402;
}

/**
 * Utility function to format payment amounts for display
 * 
 * @param amount - Amount in wei/smallest unit
 * @param decimals - Token decimals (default: 18)
 * @returns Formatted amount string
 */
export function formatPaymentAmount(amount: string, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const amountBig = BigInt(amount);
  const whole = amountBig / divisor;
  const fraction = amountBig % divisor;
  
  if (fraction === 0n) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${fractionStr}`;
}

/**
 * Utility function to parse payment amounts from user input
 * 
 * @param amount - Amount string (e.g., "1.5")
 * @param decimals - Token decimals (default: 18)
 * @returns Amount in wei/smallest unit
 */
export function parsePaymentAmount(amount: string, decimals: number = 18): string {
  const [whole, fraction = ''] = amount.split('.');
  const wholeBig = BigInt(whole || '0');
  const fractionPadded = fraction.padEnd(decimals, '0').slice(0, decimals);
  const fractionBig = BigInt(fractionPadded || '0');
  const multiplier = BigInt(10 ** decimals);
  
  return (wholeBig * multiplier + fractionBig).toString();
}

// Version information
export const VERSION = '1.0.0';
export const PROTOCOL_VERSION = '1.0';

/**
 * SDK information for debugging and support
 */
export const SDK_INFO = {
  name: '@x402/sdk',
  version: VERSION,
  protocolVersion: PROTOCOL_VERSION,
  defaultNetwork: 'somnia',
  supportedNetworks: ['somnia', 'ethereum', 'polygon', 'arbitrum', 'optimism'],
  repository: 'https://github.com/coinbase/x402',
  documentation: 'https://x402.gitbook.io/x402'
} as const;