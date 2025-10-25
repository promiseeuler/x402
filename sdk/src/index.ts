/**
 * X402 SDK - Self-Sovereign Payment System
 * Main entry point for the X402 TypeScript SDK
 */

// Main SDK class
export { X402SDK, X402SDKOptions } from './sdk';

// Core types
export {
  NetworkName,
  NetworkConfig,
  TokenConfig,
  PaymentConfig,
  TransactionConfig,
  NetworkError,
  NetworkErrorCode,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentVerification,
  SpendingLimit,
  PaymentHistory,
  X402Headers,
  X402Response,
  X402ServiceConfig,
  X402RequestConfig,
  X402ServiceResponse,
  X402ErrorCode,
  X402Error,
  X402SDKConfig,
  WalletConfig,
  ServiceDiscoveryConfig,
  DiscoveredService
} from './types';

// Wallet management
export {
  WalletManager,
  WalletManagerConfig
} from './wallet';

// Protocol implementation
export {
  X402Protocol,
  X402ProtocolConfig,
  NETWORK_CONFIGS,

  getNetworkConfig,
  getTokenConfig,
  getSupportedNetworks,
  getSupportedTokens
} from './protocol';

// Facilitator communication
export {
  FacilitatorClient,
  FacilitatorConfig,
  PaymentQuote,
  PaymentProof,
  ServiceAccess,
  FacilitatorError
} from './facilitator';

// Re-export ethers types that users might need
export type { TransactionResponse, TransactionReceipt } from 'ethers';