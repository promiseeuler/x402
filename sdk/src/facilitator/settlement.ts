import axios, { AxiosResponse } from 'axios';
import { SettlementResponse, PaymentPayload, X402Error, X402ErrorCode } from '../types/index.js';

/**
 * Settlement handler for communicating payment completion to X402 servers
 */
export class SettlementHandler {
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(options: {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}) {
    this.timeout = options.timeout || 30000; // 30 seconds
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
  }

  /**
   * Submit payment proof to the X402 server
   * @param originalUrl - The original URL that returned 402
   * @param paymentPayload - Payment proof payload
   * @returns Settlement response
   */
  async submitPayment(
    originalUrl: string,
    paymentPayload: PaymentPayload
  ): Promise<SettlementResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.makeSettlementRequest(originalUrl, paymentPayload);
        
        return {
          success: true,
          statusCode: response.status,
          data: response.data,
          headers: this.extractHeaders(response.headers)
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          break;
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    // All attempts failed
    return {
      success: false,
      error: lastError?.message || 'Settlement failed after all retry attempts'
    };
  }

  /**
   * Make the actual settlement request
   */
  private async makeSettlementRequest(
    url: string,
    paymentPayload: PaymentPayload
  ): Promise<AxiosResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Payment-Response': JSON.stringify(paymentPayload)
    };

    // Add individual payment headers for compatibility
    if (paymentPayload.txHash) {
      headers['X-Payment-TxHash'] = paymentPayload.txHash;
    }
    if (paymentPayload.network) {
      headers['X-Payment-Network'] = paymentPayload.network;
    }
    if (paymentPayload.amount) {
      headers['X-Payment-Amount'] = paymentPayload.amount;
    }
    if (paymentPayload.token) {
      headers['X-Payment-Token'] = paymentPayload.token;
    }

    return await axios({
      method: 'GET', // Retry the original request
      url,
      headers,
      timeout: this.timeout,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });
  }

  /**
   * Submit payment with POST method (alternative approach)
   * @param settlementUrl - Dedicated settlement endpoint
   * @param paymentPayload - Payment proof payload
   * @returns Settlement response
   */
  async submitPaymentPost(
    settlementUrl: string,
    paymentPayload: PaymentPayload
  ): Promise<SettlementResponse> {
    try {
      const response = await axios.post(settlementUrl, paymentPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
        headers: this.extractHeaders(response.headers)
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          statusCode: error.response?.status,
          error: error.response?.data?.message || error.message,
          data: error.response?.data
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify settlement was successful
   * @param response - Settlement response
   * @returns True if settlement was successful
   */
  static isSettlementSuccessful(response: SettlementResponse): boolean {
    return response.success && 
           response.statusCode !== undefined && 
           response.statusCode >= 200 && 
           response.statusCode < 300;
  }

  /**
   * Create payment payload from transaction details
   * @param txHash - Transaction hash
   * @param network - Network name
   * @param amount - Payment amount
   * @param token - Token address or 'native'
   * @param nonce - Optional nonce from original requirement
   * @returns Payment payload
   */
  static createPaymentPayload(
    txHash: string,
    network: string,
    amount: string,
    token: string,
    payTo: string,
    from: string,
    nonce?: string
  ): PaymentPayload {
    const payload: PaymentPayload = {
      scheme: 'exact',
      network,
      token,
      amount,
      payTo,
      nonce: nonce || '',
      signature: '',
      from,
      timestamp: Date.now(),
      txHash
    };

    return payload;
  }

  /**
   * Extract relevant headers from response
   */
  private extractHeaders(headers: any): Record<string, string> {
    const relevantHeaders: Record<string, string> = {};
    
    // Extract common headers
    const headerNames = [
      'content-type',
      'x-payment-confirmed',
      'x-settlement-id',
      'x-receipt-url'
    ];

    for (const name of headerNames) {
      const value = headers[name] || headers[name.toLowerCase()];
      if (value) {
        relevantHeaders[name] = value;
      }
    }

    return relevantHeaders;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate payment payload
   * @param payload - Payment payload to validate
   * @returns True if valid
   */
  static validatePaymentPayload(payload: PaymentPayload): boolean {
    const required = ['scheme', 'network', 'amount', 'token', 'payTo', 'from'];
    return required.every(field => payload[field as keyof PaymentPayload] !== undefined);
  }

  /**
   * Get settlement configuration
   */
  getConfig() {
    return {
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay
    };
  }

  /**
   * Update settlement configuration
   */
  updateConfig(options: {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }) {
    if (options.timeout !== undefined) this.timeout = options.timeout;
    if (options.retryAttempts !== undefined) this.retryAttempts = options.retryAttempts;
    if (options.retryDelay !== undefined) this.retryDelay = options.retryDelay;
  }
}