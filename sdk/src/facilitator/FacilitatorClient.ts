/**
 * Facilitator Communication Layer
 * Handles communication with X402 payment facilitators for verification and coordination
 */

import axios, { AxiosInstance } from 'axios';
import { NetworkName } from '../types/network';
import {
  PaymentStatus,
  PaymentVerification
} from '../types/payment';

export interface FacilitatorConfig {
  /** Base URL of the facilitator service */
  baseUrl: string;
  /** API key for authenticating with facilitator */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retries for failed requests */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface PaymentQuote {
  /** Unique quote ID */
  id: string;
  /** Payment amount in token units */
  amount: string;
  /** Token symbol */
  token: string;
  /** Target network */
  network: NetworkName;
  /** Payment recipient address */
  recipient: string;
  /** Quote expiration timestamp */
  expiresAt: number;
  /** Service description */
  description?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface PaymentProof {
  /** Transaction hash */
  transactionHash: string;
  /** Block number */
  blockNumber: number;
  /** Network where payment was made */
  network: NetworkName;
  /** Payment amount */
  amount: string;
  /** Token used for payment */
  token: string;
  /** Payment timestamp */
  timestamp: number;
}

export interface ServiceAccess {
  /** Access token for the service */
  accessToken: string;
  /** Token expiration timestamp */
  expiresAt: number;
  /** Allowed operations */
  permissions: string[];
  /** Rate limits */
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

export interface FacilitatorError {
  code: string;
  message: string;
  details?: any;
}

export class FacilitatorClient {
  private config: FacilitatorConfig;
  private httpClient: AxiosInstance;

  constructor(config: FacilitatorConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      debug: false,
      ...config
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      }
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.log('Facilitator request failed:', error.response?.data || error.message);
        throw this.createFacilitatorError(error);
      }
    );
  }

  /**
   * Request a payment quote from the facilitator
   */
  async requestQuote(
    serviceId: string,
    operation: string,
    network?: NetworkName,
    preferredToken?: string
  ): Promise<PaymentQuote> {
    try {
      this.log(`Requesting quote for service ${serviceId}, operation ${operation}`);
      
      const response = await this.httpClient.post('/quotes', {
        serviceId,
        operation,
        network,
        preferredToken
      });

      return response.data;
    } catch (error) {
      this.log('Quote request failed:', error);
      throw error;
    }
  }

  /**
   * Submit payment proof to facilitator for verification
   */
  async submitPaymentProof(
    quoteId: string,
    proof: PaymentProof
  ): Promise<PaymentVerification> {
    try {
      this.log(`Submitting payment proof for quote ${quoteId}`);
      
      const response = await this.httpClient.post(`/quotes/${quoteId}/proof`, {
        transactionHash: proof.transactionHash,
        blockNumber: proof.blockNumber,
        network: proof.network,
        amount: proof.amount,
        token: proof.token,
        timestamp: proof.timestamp
      });

      const verification: PaymentVerification = {
        verified: response.data.verified,
        payment: response.data.payment,
        error: response.data.error,
        verifiedAt: Date.now()
      };

      this.log(`Payment verification result: ${verification.verified}`);
      return verification;
    } catch (error) {
      this.log('Payment proof submission failed:', error);
      throw error;
    }
  }

  /**
   * Get service access token after successful payment
   */
  async getServiceAccess(
    quoteId: string,
    verificationId: string
  ): Promise<ServiceAccess> {
    try {
      this.log(`Getting service access for quote ${quoteId}`);
      
      const response = await this.httpClient.post(`/quotes/${quoteId}/access`, {
        verificationId
      });

      return response.data;
    } catch (error) {
      this.log('Service access request failed:', error);
      throw error;
    }
  }

  /**
   * Verify payment status with facilitator
   */
  async verifyPayment(
    transactionHash: string,
    network: NetworkName
  ): Promise<PaymentVerification> {
    try {
      this.log(`Verifying payment ${transactionHash} on ${network}`);
      
      const response = await this.httpClient.get('/payments/verify', {
        params: {
          transactionHash,
          network
        }
      });

      return {
        verified: response.data.verified,
        payment: response.data.payment,
        error: response.data.error,
        verifiedAt: Date.now()
      };
    } catch (error) {
      this.log('Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Get payment status from facilitator
   */
  async getPaymentStatus(
    paymentId: string
  ): Promise<{ status: PaymentStatus; details?: any }> {
    try {
      this.log(`Getting payment status for ${paymentId}`);
      
      const response = await this.httpClient.get(`/payments/${paymentId}/status`);
      
      return {
        status: response.data.status as PaymentStatus,
        details: response.data.details
      };
    } catch (error) {
      this.log('Payment status request failed:', error);
      throw error;
    }
  }

  /**
   * Register a new service with the facilitator
   */
  async registerService(
    serviceConfig: {
      name: string;
      description: string;
      baseUrl: string;
      supportedNetworks: NetworkName[];
      acceptedTokens: string[];
      pricing: Record<string, string>; // operation -> price
    }
  ): Promise<{ serviceId: string; apiKey: string }> {
    try {
      this.log(`Registering service ${serviceConfig.name}`);
      
      const response = await this.httpClient.post('/services/register', serviceConfig);
      
      return response.data;
    } catch (error) {
      this.log('Service registration failed:', error);
      throw error;
    }
  }

  /**
   * Update service configuration
   */
  async updateService(
    serviceId: string,
    updates: Partial<{
      name: string;
      description: string;
      baseUrl: string;
      supportedNetworks: NetworkName[];
      acceptedTokens: string[];
      pricing: Record<string, string>;
      isActive: boolean;
    }>
  ): Promise<void> {
    try {
      this.log(`Updating service ${serviceId}`);
      
      await this.httpClient.patch(`/services/${serviceId}`, updates);
    } catch (error) {
      this.log('Service update failed:', error);
      throw error;
    }
  }

  /**
   * Get service statistics
   */
  async getServiceStats(
    serviceId: string,
    timeframe?: 'hour' | 'day' | 'week' | 'month'
  ): Promise<{
    totalPayments: number;
    totalRevenue: Record<string, string>; // token -> amount
    requestCount: number;
    averagePayment: Record<string, string>;
    topOperations: Array<{ operation: string; count: number }>;
  }> {
    try {
      this.log(`Getting stats for service ${serviceId}`);
      
      const response = await this.httpClient.get(`/services/${serviceId}/stats`, {
        params: { timeframe }
      });
      
      return response.data;
    } catch (error) {
      this.log('Service stats request failed:', error);
      throw error;
    }
  }

  /**
   * Health check for facilitator service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    supportedNetworks: NetworkName[];
  }> {
    try {
      const response = await this.httpClient.get('/health');
      return response.data;
    } catch (error) {
      this.log('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Create facilitator error from axios error
   */
  private createFacilitatorError(error: any): FacilitatorError {
    if (error.response) {
      return {
        code: error.response.data?.code || 'FACILITATOR_ERROR',
        message: error.response.data?.message || 'Facilitator request failed',
        details: error.response.data
      };
    } else if (error.request) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to facilitator',
        details: error.message
      };
    } else {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown facilitator error',
        details: error
      };
    }
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[FacilitatorClient]', ...args);
    }
  }

  /**
   * Update facilitator configuration
   */
  updateConfig(updates: Partial<FacilitatorConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update HTTP client if needed
    if (updates.baseUrl) {
      this.httpClient.defaults.baseURL = updates.baseUrl;
    }
    
    if (updates.timeout) {
      this.httpClient.defaults.timeout = updates.timeout;
    }
    
    if (updates.apiKey !== undefined) {
      if (updates.apiKey) {
        this.httpClient.defaults.headers['Authorization'] = `Bearer ${updates.apiKey}`;
      } else {
        delete this.httpClient.defaults.headers['Authorization'];
      }
    }
  }
}