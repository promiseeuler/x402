import { ethers } from 'ethers';
import axios, { AxiosResponse } from 'axios';
import { X402Parser } from '../protocol/x402-parser.js';
import { PaymentFacilitator } from '../facilitator/payment.js';
import { SettlementHandler } from '../facilitator/settlement.js';
import { X402WalletManager } from '../wallet/manager.js';
import {
  SDKConfig,
  PaymentRequiredResponse,
  PaymentRequirement,
  PaymentPayload,
  VerificationResponse,
  SettlementResponse,
  X402Error,
  X402ErrorCode,
  NetworkConfig,
  WalletConfig,
  SpendingLimit
} from '../types/index.js';

/**
 * Main X402 SDK class - Unified interface for X402 payments
 * 
 * This is the primary interface developers will use to integrate X402 payments
 * into their applications. It combines all layers into a simple, easy-to-use API.
 */
export class X402SDK {
  private config: SDKConfig;
  private facilitator: PaymentFacilitator;
  private settlement: SettlementHandler;
  private walletManager: X402WalletManager;
  private networkConfig: NetworkConfig;

  constructor(config: Partial<SDKConfig> = {}) {
    // Default to Somnia Testnet configuration
    this.networkConfig = config.network || {
      chainId: 50312,
      name: 'somnia',
      rpcUrl: 'https://dream-rpc.somnia.network',
      currency: 'STT',
      explorer: 'https://shannon-explorer.somnia.network/'
    };

    this.config = {
      network: this.networkConfig,
      autoSettle: config.autoSettle ?? true,
      retryAttempts: config.retryAttempts ?? 3,
      timeout: config.timeout ?? 30000,
      facilitatorUrl: config.facilitatorUrl
    };

    // Initialize components
    const provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
    this.facilitator = new PaymentFacilitator(provider, this.networkConfig);
    this.settlement = new SettlementHandler({
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts
    });
    this.walletManager = new X402WalletManager(this.networkConfig, provider);
  }

  /**
   * Create a new wallet for payments
   * @param password - Password to encrypt the wallet
   * @returns Wallet configuration with address and encrypted private key
   */
  async createWallet(password: string) {
    return await this.walletManager.createWallet({ password });
  }

  /**
   * Load an existing wallet
   * @param encryptedPrivateKey - Encrypted private key JSON
   * @param password - Password to decrypt the wallet
   * @returns Wallet address
   */
  async loadWallet(encryptedPrivateKey: string, password: string) {
    return await this.walletManager.loadWallet(encryptedPrivateKey, password);
  }

  /**
   * Load wallet from private key (development only)
   * @param privateKey - Raw private key
   * @returns Wallet address
   */
  loadWalletFromPrivateKey(privateKey: string) {
    return this.walletManager.loadWalletFromPrivateKey(privateKey);
  }

  /**
   * Set spending limits for a token
   * @param token - Token symbol or address
   * @param limits - Spending limit configuration
   */
  setSpendingLimit(token: string, limits: { perTransaction?: number; daily?: number }) {
    this.walletManager.setSpendingLimit(token, limits);
  }

  /**
   * Make a request that may require payment
   * @param url - URL to request
   * @param options - Request options
   * @returns Response data or payment requirement
   */
  async request(url: string, options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    data?: any;
    autoPayment?: boolean;
  } = {}): Promise<{
    success: boolean;
    data?: any;
    paymentRequired?: PaymentRequiredResponse;
    error?: string;
  }> {
    try {
      // Make initial request
      const response = await axios({
        method: options.method || 'GET',
        url,
        headers: options.headers,
        data: options.data,
        validateStatus: (status) => status < 500 // Don't throw on 402
      });

      // Check if payment is required
      if (response.status === 402) {
        const paymentRequired = await X402Parser.parse402(response);
        
        // Auto-payment if enabled and wallet is loaded
        if (options.autoPayment !== false && this.config.autoSettle && this.walletManager.getWallet()) {
          const paymentResult = await this.handlePayment(paymentRequired, url);
          if (paymentResult.success) {
            return paymentResult;
          }
        }

        return {
          success: false,
          paymentRequired
        };
      }

      // Successful response
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      };
    }
  }

  /**
   * Handle payment for a 402 response
   * @param paymentRequired - Payment requirements from 402 response
   * @param originalUrl - Original URL that required payment
   * @returns Payment result
   */
  async handlePayment(
    paymentRequired: PaymentRequiredResponse,
    originalUrl: string
  ): Promise<{
    success: boolean;
    data?: any;
    paymentPayload?: PaymentPayload;
    error?: string;
  }> {
    try {
      const wallet = this.walletManager.getWallet();
      if (!wallet) {
        throw new X402Error('No wallet loaded', X402ErrorCode.WALLET_ERROR);
      }

      // Select best payment requirement
      const requirement = X402Parser.selectBestRequirement(
        paymentRequired.accepts,
        this.networkConfig.name
      );

      if (!requirement) {
        throw new X402Error('No suitable payment requirement found', X402ErrorCode.INVALID_PAYMENT_RESPONSE);
      }

      // Check spending limits
      if (!this.walletManager.checkSpendingLimit(requirement.token, requirement.amount)) {
        throw new X402Error('Payment exceeds spending limits', X402ErrorCode.SPENDING_LIMIT_EXCEEDED);
      }

      // Execute payment
      const txHash = await this.facilitator.executePayment(requirement, wallet);

      // Create payment payload
      const paymentPayload: PaymentPayload = {
        scheme: requirement.scheme,
        network: requirement.network,
        token: requirement.token,
        amount: requirement.amount,
        payTo: requirement.payTo,
        nonce: requirement.nonce || '',
        signature: '', // Would be filled by actual implementation
        from: wallet.address,
        timestamp: Date.now()
      };

      // Verify payment
      const verification = await this.facilitator.verifyPayment(txHash, requirement);
      if (!verification.valid) {
        throw new X402Error('Payment verification failed', X402ErrorCode.PAYMENT_VERIFICATION_FAILED);
      }

      // Record payment for spending limits
      this.walletManager.recordPayment(requirement.token, requirement.amount);

      // Settle payment and retry original request
      const settlementResult = await this.settlement.submitPayment(originalUrl, paymentPayload);
      
      if (settlementResult.success) {
        return {
          success: true,
          data: settlementResult.data,
          paymentPayload
        };
      } else {
        return {
          success: false,
          error: settlementResult.error,
          paymentPayload
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  /**
   * Pay for a specific requirement manually
   * @param requirement - Payment requirement
   * @returns Payment payload
   */
  async pay(requirement: PaymentRequirement): Promise<PaymentPayload> {
    const wallet = this.walletManager.getWallet();
    if (!wallet) {
      throw new X402Error('No wallet loaded', X402ErrorCode.WALLET_ERROR);
    }

    // Check spending limits
    if (!this.walletManager.checkSpendingLimit(requirement.token, requirement.amount)) {
      throw new X402Error('Payment exceeds spending limits', X402ErrorCode.SPENDING_LIMIT_EXCEEDED);
    }

    // Execute payment
    const txHash = await this.facilitator.executePayment(requirement, wallet);

    // Create payment payload
    const paymentPayload: PaymentPayload = {
      scheme: requirement.scheme,
      network: requirement.network,
      token: requirement.token,
      amount: requirement.amount,
      payTo: requirement.payTo,
      nonce: requirement.nonce || '',
      signature: '', // Would be filled by actual implementation
      from: wallet.address,
      timestamp: Date.now()
    };

    // Record payment for spending limits
    this.walletManager.recordPayment(requirement.token, requirement.amount);

    return paymentPayload;
  }

  /**
   * Verify a payment transaction
   * @param txHash - Transaction hash to verify
   * @param requirement - Original payment requirement
   * @returns Verification response
   */
  async verifyPayment(txHash: string, requirement: PaymentRequirement): Promise<VerificationResponse> {
    return await this.facilitator.verifyPayment(txHash, requirement);
  }

  /**
   * Get wallet balance
   * @param token - Token address (optional, defaults to native token)
   * @returns Balance string
   */
  async getBalance(token?: string): Promise<string> {
    if (token) {
      return await this.walletManager.getTokenBalance(token);
    } else {
      return await this.walletManager.getBalance();
    }
  }

  /**
   * Get wallet address
   * @returns Wallet address or null if not loaded
   */
  getWalletAddress(): string | null {
    return this.walletManager.getAddress();
  }

  /**
   * Get remaining spending allowance
   * @param token - Token symbol or address
   * @returns Remaining allowance information
   */
  getRemainingAllowance(token: string) {
    return this.walletManager.getRemainingAllowance(token);
  }

  /**
   * Get network status
   * @returns Network information
   */
  async getNetworkStatus() {
    // Network status check - placeholder implementation
    try {
      const blockNumber = await this.walletManager.getProvider().getBlockNumber();
      return { connected: true, blockNumber };
    } catch (error) {
      return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get SDK configuration
   * @returns Current configuration
   */
  getConfig(): SDKConfig {
    return { ...this.config };
  }

  /**
   * Update SDK configuration
   * @param updates - Configuration updates
   */
  updateConfig(updates: Partial<SDKConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update settlement handler if timeout or retry settings changed
    if (updates.timeout || updates.retryAttempts) {
      const updateConfig: { timeout?: number; retryAttempts?: number; retryDelay?: number } = {};
      if (this.config.timeout !== undefined) updateConfig.timeout = this.config.timeout;
      if (this.config.retryAttempts !== undefined) updateConfig.retryAttempts = this.config.retryAttempts;
      this.settlement.updateConfig(updateConfig);
    }
  }

  /**
   * Clear wallet from memory (security)
   */
  clearWallet(): void {
    this.walletManager.clearWallet();
  }
}

/**
 * Create X402 SDK instance with Somnia Testnet defaults
 * @param config - Optional configuration overrides
 * @returns X402SDK instance
 */
export function createX402SDK(config: Partial<SDKConfig> = {}): X402SDK {
  return new X402SDK(config);
}

/**
 * Parse a 402 Payment Required response
 * @param response - HTTP Response with 402 status
 * @returns Parsed payment requirements
 */
export function parse402Response(response: Response): Promise<PaymentRequiredResponse> {
  return X402Parser.parse402(response);
}

// Re-export types for convenience
export type {
  SDKConfig,
  PaymentRequiredResponse,
  PaymentRequirement,
  PaymentPayload,
  VerificationResponse,
  SettlementResponse,
  NetworkConfig,
  WalletConfig,
  SpendingLimit
} from '../types/index.js';

// Re-export error classes
export { X402Error, X402ErrorCode } from '../types/index.js';