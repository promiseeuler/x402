/**
 * X402 SDK - Main Export File
 * Professional AI Payment Infrastructure SDK
 */

// Core SDK
export { X402SDK } from './sdk/X402SDK';
export type { X402SDKOptions as X402Config, X402SDKOptions as X402Options } from './sdk/X402SDK';

// Wallet Management
export { WalletManager } from './wallet/WalletManager';
export { EmbeddedWalletManager } from './wallet/EmbeddedWalletManager';
export type { 
  EmbeddedWalletConfig, 
  WalletBackup, 
  WalletRecoveryOptions 
} from './wallet/EmbeddedWalletManager';

// Protocol and Core Types
export { X402Protocol } from './protocol/X402Protocol';
export type {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  NetworkConfig,
  TokenConfig,
  NetworkName
} from './types';

// Export all types
export * from './types';

// Facilitator
export { FacilitatorClient, AIFacilitator } from './facilitator';

// Services
export { OpenRouterAI } from './services';
export type * from './services';

// Utilities
export * from './utils';

// Constants
export const X402_VERSION = '1.0.0';
export const SUPPORTED_NETWORKS = {
  SEPOLIA: {
    name: 'sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/',
    currency: 'ETH',
    testnet: true
  },
  MAINNET: {
    name: 'mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    currency: 'ETH',
    testnet: false
  }
} as const;

// Default Configuration
export const DEFAULT_CONFIG: Partial<X402Config> = {
  defaultNetwork: 'sepolia' as any,
  wallet: { createRandom: true },
  facilitator: { baseUrl: 'http://localhost:3000' },
  options: { debug: false }
};

// SDK Factory Functions
export const createX402SDK = (config: X402Config): X402SDK => {
  return new X402SDK(config);
};

export const createEmbeddedWallet = (config: EmbeddedWalletConfig): EmbeddedWalletManager => {
  return new EmbeddedWalletManager(config);
};

// Error Classes
export class X402Error extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'X402Error';
  }
}

export class WalletError extends X402Error {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'WalletError';
  }
}

export class PaymentError extends X402Error {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'PaymentError';
  }
}

export class NetworkError extends X402Error {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'NetworkError';
  }
}

// Event Types
export interface X402Events {
  'wallet:connected': { address: string; balance: string };
  'wallet:disconnected': {};
  'wallet:locked': {};
  'wallet:unlocked': { address: string };
  'payment:initiated': { id: string; amount: string; recipient: string };
  'payment:completed': { id: string; txHash: string };
  'payment:failed': { id: string; error: string };
  'balance:updated': { address: string; balance: string };
  'network:changed': { chainId: number; name: string };
}

// Event Emitter Interface
export interface X402EventEmitter {
  on<K extends keyof X402Events>(event: K, listener: (data: X402Events[K]) => void): void;
  off<K extends keyof X402Events>(event: K, listener: (data: X402Events[K]) => void): void;
  emit<K extends keyof X402Events>(event: K, data: X402Events[K]): void;
}

// AI Provider Types
export interface AIProvider {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  costPerRequest: number;
  currency: string;
  status: 'active' | 'inactive' | 'maintenance';
  features: string[];
  authentication?: {
    type: 'api_key' | 'bearer' | 'custom';
    headerName?: string;
  };
}

export interface AIPaymentRequest {
  providerId: string;
  requestData: any;
  customAmount?: number;
  metadata?: Record<string, any>;
}

export interface AIPaymentResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  response?: any;
  error?: string;
}

// Integration Helpers
export const createAIProvider = (config: Omit<AIProvider, 'id'>): AIProvider => {
  return {
    id: `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...config
  };
};

export const validateAIProvider = (provider: AIProvider): boolean => {
  return !!(provider.id && provider.name && provider.baseUrl && provider.costPerRequest >= 0);
};

// Storage Interface
export interface X402Storage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Default Browser Storage Implementation
export class BrowserStorage implements X402Storage {
  private prefix = 'x402_';

  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(this.prefix + key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch (error) {
      throw new X402Error(`Failed to store data: ${error}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      throw new X402Error(`Failed to remove data: ${error}`);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      throw new X402Error(`Failed to clear storage: ${error}`);
    }
  }
}

// Import for default export
import { X402SDK } from './sdk/X402SDK';
import type { X402SDKOptions as X402Config } from './sdk/X402SDK';
import { WalletManager } from './wallet/WalletManager';
import { EmbeddedWalletManager } from './wallet/EmbeddedWalletManager';
import type { EmbeddedWalletConfig } from './wallet/EmbeddedWalletManager';
import { X402Protocol } from './protocol/X402Protocol';
import { FacilitatorClient, AIFacilitator } from './facilitator';
import { OpenRouterAI } from './services';

// Export everything as default for convenience
export default {
  X402SDK,
  WalletManager,
  EmbeddedWalletManager,
  X402Protocol,
  FacilitatorClient,
  AIFacilitator,
  OpenRouterAI,
  createX402SDK,
  createEmbeddedWallet,
  createAIProvider,
  validateAIProvider,
  BrowserStorage,
  X402Error,
  WalletError,
  PaymentError,
  NetworkError,
  X402_VERSION,
  SUPPORTED_NETWORKS,
  DEFAULT_CONFIG
};

// Re-export ethers types that users might need
export type { TransactionResponse, TransactionReceipt } from 'ethers';