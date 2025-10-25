/**
 * X402 SDK - Main SDK Class
 * Provides a unified interface for X402 self-sovereign payment system
 */

import {
  NetworkName,
  X402RequestConfig,
  X402ServiceResponse,
  SpendingLimit
} from '../types';
import { WalletManager, WalletManagerConfig } from '../wallet';
import { X402Protocol, X402ProtocolConfig } from '../protocol';
import { FacilitatorClient, FacilitatorConfig } from '../facilitator';
import { getNetworkConfig, getSupportedNetworks } from '../protocol/networks';

export interface X402SDKOptions {
  /** Default network for payments */
  defaultNetwork: NetworkName;
  /** Wallet configuration */
  wallet: {
    /** Private key for wallet */
    privateKey?: string;
    /** Mnemonic phrase for wallet */
    mnemonic?: string;
    /** Create random wallet if no key provided */
    createRandom?: boolean;
  };
  /** Spending limits configuration */
  spendingLimits?: SpendingLimit;
  /** Default facilitator configuration */
  facilitator?: {
    baseUrl: string;
    apiKey?: string;
  };
  /** SDK configuration options */
  options?: {
    /** Enable debug logging */
    debug?: boolean;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Maximum payment retries */
    maxRetries?: number;
  };
}

export class X402SDK {
  private walletManager: WalletManager;
  private protocol: X402Protocol;
  private defaultFacilitator?: FacilitatorClient;
  private config: X402SDKOptions;

  constructor(config: X402SDKOptions) {
    this.config = config;
    
    // Initialize wallet manager
    const walletConfig: WalletManagerConfig = {
      privateKey: config.wallet?.privateKey,
      mnemonic: config.wallet?.mnemonic
    };
    
    this.walletManager = new WalletManager(walletConfig);
    
    // Initialize protocol
    const protocolConfig: X402ProtocolConfig = {
      walletManager: this.walletManager,
      defaultNetwork: config.defaultNetwork,
      spendingLimits: config.spendingLimits,
      maxRetries: config.options?.maxRetries,
      timeout: config.options?.timeout,
      debug: config.options?.debug
    };
    
    this.protocol = new X402Protocol(protocolConfig);
    
    // Initialize default facilitator if provided
    if (config.facilitator) {
      this.defaultFacilitator = new FacilitatorClient({
        baseUrl: config.facilitator.baseUrl,
        apiKey: config.facilitator.apiKey,
        debug: config.options?.debug
      });
    }
  }

  /**
   * Initialize wallet based on configuration
   */
  async initializeWallet(): Promise<void> {
    if (this.config.wallet.privateKey) {
      await this.walletManager.createFromPrivateKey(this.config.wallet.privateKey);
    } else if (this.config.wallet.mnemonic) {
      await this.walletManager.createFromMnemonic(this.config.wallet.mnemonic);
    } else if (this.config.wallet.createRandom) {
      await this.walletManager.createRandom();
    } else {
      throw new Error('No wallet configuration provided. Specify privateKey, mnemonic, or set createRandom to true.');
    }
  }

  /**
   * Make an HTTP request with automatic X402 payment handling
   */
  async request<T = any>(config: X402RequestConfig): Promise<X402ServiceResponse<T>> {
    return this.protocol.request<T>(config);
  }

  /**
   * Make a GET request with automatic payment handling
   */
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<X402ServiceResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      headers
    });
  }

  /**
   * Make a POST request with automatic payment handling
   */
  async post<T = any>(
    url: string, 
    data?: any, 
    headers?: Record<string, string>
  ): Promise<X402ServiceResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      headers
    });
  }

  /**
   * Make a PUT request with automatic payment handling
   */
  async put<T = any>(
    url: string, 
    data?: any, 
    headers?: Record<string, string>
  ): Promise<X402ServiceResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      headers
    });
  }

  /**
   * Make a DELETE request with automatic payment handling
   */
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<X402ServiceResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      headers
    });
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.walletManager.getAddress();
  }

  /**
   * Get wallet balance for a specific network and token
   */
  async getBalance(
    network: NetworkName, 
    tokenAddress?: string
  ): Promise<string> {
    return this.walletManager.getBalance(network, tokenAddress);
  }

  /**
   * Check if wallet has sufficient balance for a payment
   */
  async hasSufficientBalance(
    network: NetworkName,
    amount: string,
    tokenAddress?: string
  ): Promise<boolean> {
    return this.walletManager.hasSufficientBalance(network, amount, tokenAddress);
  }

  /**
   * Get current spending for a network/token combination
   */
  getCurrentSpending(network: NetworkName, token: string): number {
    return this.protocol.getCurrentSpending(network, token);
  }

  /**
   * Clear spending history
   */
  clearSpendingHistory(): void {
    this.protocol.clearSpendingHistory();
  }

  /**
   * Create a facilitator client for a specific service
   */
  createFacilitatorClient(config: FacilitatorConfig): FacilitatorClient {
    return new FacilitatorClient({
      debug: this.config.options?.debug,
      ...config
    });
  }

  /**
   * Get the default facilitator client
   */
  getFacilitator(): FacilitatorClient | undefined {
    return this.defaultFacilitator;
  }

  /**
   * Update spending limits
   */
  updateSpendingLimits(limits: SpendingLimit): void {
    this.config.spendingLimits = limits;
    // Note: Would need to update protocol config, but X402Protocol doesn't expose this method
    // This is a limitation that could be addressed in a future version
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks(): NetworkName[] {
    return getSupportedNetworks();
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(network: NetworkName) {
    return getNetworkConfig(network);
  }

  /**
   * Switch default network
   */
  switchNetwork(network: NetworkName): void {
    if (!getSupportedNetworks().includes(network)) {
      throw new Error(`Network ${network} is not supported`);
    }
    this.config.defaultNetwork = network;
  }

  /**
   * Export wallet private key (use with caution)
   */
  exportPrivateKey(): string {
    return this.walletManager.getPrivateKey();
  }

  /**
   * Get SDK configuration
   */
  getConfig(): X402SDKOptions {
    return { ...this.config };
  }

  /**
   * Create a new SDK instance with different configuration
   */
  static async create(config: X402SDKOptions): Promise<X402SDK> {
    const sdk = new X402SDK(config);
    // Wait for wallet initialization
    await sdk.initializeWallet();
    return sdk;
  }

  /**
   * Create SDK instance with random wallet
   */
  static async createWithRandomWallet(
    network: NetworkName,
    options?: Partial<X402SDKOptions>
  ): Promise<X402SDK> {
    return X402SDK.create({
      defaultNetwork: network,
      wallet: { createRandom: true },
      ...options
    });
  }

  /**
   * Create SDK instance from private key
   */
  static async createFromPrivateKey(
    privateKey: string,
    network: NetworkName,
    options?: Partial<X402SDKOptions>
  ): Promise<X402SDK> {
    return X402SDK.create({
      defaultNetwork: network,
      wallet: { privateKey },
      ...options
    });
  }

  /**
   * Create SDK instance from mnemonic
   */
  static async createFromMnemonic(
    mnemonic: string,
    network: NetworkName,
    options?: Partial<X402SDKOptions>
  ): Promise<X402SDK> {
    return X402SDK.create({
      defaultNetwork: network,
      wallet: { mnemonic },
      ...options
    });
  }
}