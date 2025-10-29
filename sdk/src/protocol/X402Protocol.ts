/**
 * HTTP 402 Protocol Implementation
 * Handles automatic payment processing for X402-enabled APIs
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ethers } from 'ethers';
import { WalletManager } from '../wallet/WalletManager';
import { getTokenConfig } from './networks';
import {
  X402Headers,
  X402RequestConfig,
  X402ServiceResponse,
  X402Error,
  X402ErrorCode
} from '../types/protocol';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  SpendingLimit
} from '../types/payment';
import { NetworkName } from '../types/network';

export interface X402ProtocolConfig {
  /** Wallet manager for transaction signing */
  walletManager: WalletManager;
  /** Default network for payments */
  defaultNetwork: NetworkName;
  /** Spending limits */
  spendingLimits?: SpendingLimit;
  /** Maximum retries for failed payments */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export class X402Protocol {
  private config: X402ProtocolConfig;
  private httpClient: AxiosInstance;
  private spendingTracker: Map<string, { amount: number; timestamp: number }[]> = new Map();

  constructor(config: X402ProtocolConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      debug: false,
      ...config
    };

    this.httpClient = axios.create({
      timeout: this.config.timeout,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });

    // Add request interceptor for automatic payment handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 402) {
          return this.handle402Response(error.response, error.config);
        }
        throw error;
      }
    );
  }

  /**
   * Make an HTTP request with automatic payment handling
   */
  async request<T = any>(config: X402RequestConfig): Promise<X402ServiceResponse<T>> {
    try {
      const response = await this.httpClient.request({
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data,
        timeout: config.timeout || this.config.timeout
      });

      return {
        data: response.data,
        status: response.status,
        headers: Object.fromEntries(
          Object.entries(response.headers).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(', ') : String(value || '')
          ])
        )
      };
    } catch (error: any) {
      if (error.response?.status === 402) {
        // This should be handled by the interceptor, but just in case
        throw this.createX402Error(X402ErrorCode.PAYMENT_REQUIRED, 'Payment required', error.response);
      }
      throw error;
    }
  }

  /**
   * Handle HTTP 402 Payment Required response
   */
  private async handle402Response(response: AxiosResponse, originalConfig: AxiosRequestConfig): Promise<AxiosResponse> {
    try {
      const paymentRequest = this.parsePaymentRequest(response);
      
      // Check spending limits
      if (!this.checkSpendingLimits(paymentRequest)) {
        throw this.createX402Error(X402ErrorCode.INSUFFICIENT_FUNDS, 'Spending limit exceeded');
      }

      // Process payment
      const paymentResponse = await this.processPayment(paymentRequest);
      
      // Track spending
      this.trackSpending(paymentRequest);

      // Retry original request with payment proof
      const retryConfig = {
        ...originalConfig,
        headers: {
          ...originalConfig.headers,
          'X-Payment-Hash': paymentResponse.transactionHash,
          'X-Payment-Network': paymentRequest.network,
          'X-Payment-Amount': paymentRequest.amount,
          'X-Payment-Token': paymentRequest.token
        }
      };

      const retryResponse = await this.httpClient.request(retryConfig);
      
      // Add payment info to response
      (retryResponse as any).payment = {
        amount: paymentRequest.amount,
        token: paymentRequest.token,
        transactionHash: paymentResponse.transactionHash,
        network: paymentRequest.network
      };

      return retryResponse;
    } catch (error) {
      this.log('Payment handling failed:', error);
      throw error;
    }
  }

  /**
   * Parse payment request from 402 response headers
   */
  private parsePaymentRequest(response: AxiosResponse): PaymentRequest {
    const headers = response.headers as Partial<X402Headers>;
    
    if (!headers['x-payment-facilitator'] || !headers['x-payment-amount'] || !headers['x-payment-token']) {
      throw this.createX402Error(X402ErrorCode.INVALID_PAYMENT, 'Invalid payment headers in 402 response');
    }

    const network = (headers['x-payment-network'] || this.config.defaultNetwork) as NetworkName;
    const recipient = headers['x-payment-recipient'] || '';
    
    if (!recipient) {
      throw this.createX402Error(X402ErrorCode.INVALID_PAYMENT, 'Missing payment recipient');
    }

    return {
      id: headers['x-payment-id'] || `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: headers['x-payment-amount'],
      token: headers['x-payment-token'],
      network,
      recipient,
      facilitatorUrl: headers['x-payment-facilitator'],
      description: headers['x-payment-description'],
      expiresAt: headers['x-payment-expires'] ? parseInt(headers['x-payment-expires']) : undefined
    };
  }

  /**
   * Process payment for a request
   */
  private async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const tokenConfig = getTokenConfig(paymentRequest.network, paymentRequest.token);
      
      if (!tokenConfig) {
        throw this.createX402Error(X402ErrorCode.UNSUPPORTED_TOKEN, `Token ${paymentRequest.token} not supported on ${paymentRequest.network}`);
      }

      // Check if wallet has sufficient balance
      const hasSufficientBalance = await this.config.walletManager.hasSufficientBalance(
        paymentRequest.network,
        paymentRequest.amount,
        tokenConfig.isNative ? undefined : tokenConfig.address
      );

      if (!hasSufficientBalance) {
        throw this.createX402Error(X402ErrorCode.INSUFFICIENT_FUNDS, 'Insufficient balance for payment');
      }

      // Send payment transaction
      let txResponse;
      if (tokenConfig.isNative) {
        txResponse = await this.config.walletManager.sendTransaction(
          paymentRequest.network,
          paymentRequest.recipient,
          paymentRequest.amount
        );
      } else {
        txResponse = await this.config.walletManager.sendTokenTransaction(
          paymentRequest.network,
          tokenConfig.address!,
          paymentRequest.recipient,
          paymentRequest.amount,
          tokenConfig.decimals
        );
      }

      // Wait for transaction confirmation
      const receipt = await this.config.walletManager.waitForTransaction(
        paymentRequest.network,
        txResponse.hash,
        1, // 1 confirmation
        60000 // 60 second timeout
      );

      if (!receipt) {
        throw this.createX402Error(X402ErrorCode.PAYMENT_FAILED, 'Transaction confirmation timeout');
      }

      this.log(`Payment successful: ${txResponse.hash}`);

      return {
        requestId: paymentRequest.id,
        transactionHash: txResponse.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString(),
        status: PaymentStatus.CONFIRMED,
        timestamp: Date.now()
      };
    } catch (error: any) {
      this.log('Payment failed:', error);
      throw this.createX402Error(X402ErrorCode.PAYMENT_FAILED, `Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Check spending limits
   */
  private checkSpendingLimits(paymentRequest: PaymentRequest): boolean {
    if (!this.config.spendingLimits) {
      return true;
    }

    const limits = this.config.spendingLimits;
    const amount = parseFloat(paymentRequest.amount);
    
    // Check per-request limit
    if (amount > parseFloat(limits.maxPerRequest)) {
      return false;
    }

    // Check total spending in window
    const now = Date.now();
    const windowStart = now - (limits.windowSeconds * 1000);
    const key = `${paymentRequest.network}_${paymentRequest.token}`;
    
    const spending = this.spendingTracker.get(key) || [];
    const recentSpending = spending.filter(s => s.timestamp > windowStart);
    const totalSpent = recentSpending.reduce((sum, s) => sum + s.amount, 0);
    
    return (totalSpent + amount) <= parseFloat(limits.maxTotal);
  }

  /**
   * Track spending for limits
   */
  private trackSpending(paymentRequest: PaymentRequest): void {
    if (!this.config.spendingLimits) {
      return;
    }

    const key = `${paymentRequest.network}_${paymentRequest.token}`;
    const spending = this.spendingTracker.get(key) || [];
    
    spending.push({
      amount: parseFloat(paymentRequest.amount),
      timestamp: Date.now()
    });
    
    // Clean old entries
    const windowStart = Date.now() - (this.config.spendingLimits.windowSeconds * 1000);
    const recentSpending = spending.filter(s => s.timestamp > windowStart);
    
    this.spendingTracker.set(key, recentSpending);
  }

  /**
   * Create X402 error
   */
  private createX402Error(code: X402ErrorCode, message: string, response?: AxiosResponse): X402Error {
    const error: X402Error = {
      code,
      message
    };
    
    if (response) {
      error.details = {
        status: response.status,
        headers: response.headers,
        data: response.data
      };
    }
    
    return error;
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[X402Protocol]', ...args);
    }
  }

  /**
   * Get current spending for a network/token
   */
  getCurrentSpending(network: NetworkName, token: string): number {
    if (!this.config.spendingLimits) {
      return 0;
    }

    const key = `${network}_${token}`;
    const spending = this.spendingTracker.get(key) || [];
    const windowStart = Date.now() - (this.config.spendingLimits.windowSeconds * 1000);
    const recentSpending = spending.filter(s => s.timestamp > windowStart);
    
    return recentSpending.reduce((sum, s) => sum + s.amount, 0);
  }

  /**
   * Clear spending history
   */
  clearSpendingHistory(): void {
    this.spendingTracker.clear();
  }

  /**
   * Make a direct payment
   */
  async makePayment(params: {
    amount: string;
    recipient: string;
    metadata?: any;
    network?: NetworkName;
  }): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      const network = params.network || this.config.defaultNetwork;
      
      this.log('makePayment called with params:', {
        amount: params.amount,
        recipient: params.recipient,
        network: network,
        metadata: params.metadata
      });
      
      // Validate amount format
      if (!params.amount || params.amount.trim() === '') {
        return {
          success: false,
          error: 'Amount cannot be empty'
        };
      }
      
      // Check spending limits
      const amountNum = parseFloat(params.amount);
      if (!isFinite(amountNum) || amountNum <= 0) {
        return {
          success: false,
          error: `Invalid amount: ${params.amount}`
        };
      }
      
      if (this.config.spendingLimits) {
        const currentSpending = this.getCurrentSpending(network, 'STT');
        if (currentSpending + amountNum > parseFloat(this.config.spendingLimits.maxTotal)) {
          return {
            success: false,
            error: 'Spending limit exceeded'
          };
        }
      }

      // Check wallet balance before attempting transaction
      const hasSufficientBalance = await this.config.walletManager.hasSufficientBalance(
        network,
        params.amount
      );
      
      if (!hasSufficientBalance) {
        return {
          success: false,
          error: 'Insufficient balance for payment'
        };
      }

      this.log('Sending transaction with amount:', params.amount);
      
      // Send transaction
      const txResponse = await this.config.walletManager.sendTransaction(
        network,
        params.recipient,
        params.amount
      );

      // Track spending
      const spending = this.spendingTracker.get(`${network}:STT`) || [];
      spending.push({ amount: amountNum, timestamp: Date.now() });
      this.spendingTracker.set(`${network}:STT`, spending);

      this.log(`Payment successful: ${txResponse.hash}`);

      return {
        success: true,
        transactionHash: txResponse.hash
      };
    } catch (error: any) {
      this.log('Payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(transactionHash: string): Promise<{
    verified: boolean;
    amount: number;
    currency: string;
    network: NetworkName;
  }> {
    try {
      // In a real implementation, this would verify the transaction on-chain
      // For now, we'll simulate verification
      const receipt = await this.config.walletManager.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return {
          verified: false,
          amount: 0,
          currency: 'STT',
          network: this.config.defaultNetwork
        };
      }

      // Extract payment details from transaction receipt
       // This is a simplified implementation
       return {
         verified: receipt.status === 1,
         amount: parseFloat(ethers.formatEther(receipt.gasUsed * receipt.gasPrice)),
         currency: 'STT',
         network: this.config.defaultNetwork
       };
    } catch (error) {
      this.log('Payment verification failed:', error);
      return {
        verified: false,
        amount: 0,
        currency: 'STT',
        network: this.config.defaultNetwork
      };
    }
  }
}