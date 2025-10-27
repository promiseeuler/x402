/**
 * AI Facilitator
 * Handles AI service payments and request routing through X402 protocol
 */

import { EventEmitter } from 'events';
import { X402Protocol } from '../protocol/X402Protocol';
import { OpenRouterAI } from '../services/OpenRouterAI';
import { WalletManager } from '../wallet/WalletManager';
import { NetworkName } from '../types/network';

import { SpendingLimit } from '../types/payment';

export interface AIFacilitatorConfig {
  walletManager: WalletManager;
  openRouterApiKey: string;
  network?: NetworkName;
  spendingLimits?: SpendingLimit;
  debug?: boolean;
}

export interface AIServiceRequest {
  id: string;
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface AIServiceResponse {
  id: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    amount: number;
    currency: string;
  };
  transactionHash?: string;
  timestamp: Date;
}

export interface PaymentVerification {
  transactionHash: string;
  amount: number;
  currency: string;
  verified: boolean;
  timestamp: Date;
}

export class AIFacilitator extends EventEmitter {
  private x402Protocol: X402Protocol;
  private openRouterAI: OpenRouterAI;
  private config: AIFacilitatorConfig;
  private activeRequests: Map<string, AIServiceRequest> = new Map();
  private completedRequests: Map<string, AIServiceResponse> = new Map();

  constructor(config: AIFacilitatorConfig) {
    super();
    this.config = config;

    // Initialize X402 Protocol
    this.x402Protocol = new X402Protocol({
      walletManager: config.walletManager,
      defaultNetwork: config.network || 'SOMNIA_TESTNET',
      spendingLimits: config.spendingLimits || {
        maxPerRequest: '10',
        maxTotal: '100',
        windowSeconds: 86400,
        currentSpending: '0',
        windowStart: Date.now()
      },
      debug: config.debug
    });

    // Initialize OpenRouter AI
    this.openRouterAI = new OpenRouterAI({
      apiKey: config.openRouterApiKey,
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'anthropic/claude-3-haiku',
      costPerRequest: 0.001,
      network: config.network || 'SOMNIA_TESTNET'
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Payment events will be handled through the protocol's response system
  }

  /**
   * Process an AI service request with payment
   */
  async processAIRequest(request: AIServiceRequest): Promise<AIServiceResponse> {
    try {
      this.activeRequests.set(request.id, request);
      console.log(`🚀 AI request started: ${request.id}`);
      this.emit('requestStarted', request);

      // Calculate cost for the request
      const costEstimate = await this.openRouterAI.calculateCost({
        model: request.model,
        prompt: request.prompt,
        maxTokens: request.maxTokens || 1000
      });

      console.log(`💰 Cost calculated for ${request.id}: ${costEstimate.amount} STT`);
      this.emit('costCalculated', { requestId: request.id, cost: costEstimate });

      // Make the paid AI request
      console.log(`🔄 Making OpenRouter API request for ${request.id}...`);
      const aiResponse = await this.openRouterAI.makeRequest({
        model: request.model,
        prompt: request.prompt,
        maxTokens: request.maxTokens || 1000,
        temperature: request.temperature
      });

      console.log(`📝 AI response received for ${request.id}: ${aiResponse.content.substring(0, 100)}...`);

      // Create service response
      const serviceResponse: AIServiceResponse = {
        id: request.id,
        content: aiResponse.content,
        usage: aiResponse.usage,
        cost: {
          amount: costEstimate.amount,
          currency: 'STT'
        },
        transactionHash: aiResponse.transactionHash,
        timestamp: new Date()
      };

      this.completedRequests.set(request.id, serviceResponse);
      this.activeRequests.delete(request.id);

      console.log(`🎉 AI request completed: ${request.id}`);
      this.emit('requestCompleted', serviceResponse);
      return serviceResponse;

    } catch (error: any) {
      this.activeRequests.delete(request.id);
      console.error(`❌ AI request failed: ${request.id}`, error.message);
      this.emit('requestFailed', { requestId: request.id, error: error.message });
      throw error;
    }
  }

  /**
   * Verify a payment for an AI request
   */
  async verifyPayment(transactionHash: string): Promise<PaymentVerification> {
    try {
      // Use X402 protocol to verify the payment
      const verification = await this.x402Protocol.verifyPayment(transactionHash);
      
      return {
        transactionHash,
        amount: verification.amount,
        currency: verification.currency,
        verified: verification.verified,
        timestamp: new Date()
      };
    } catch (error: any) {
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<any[]> {
    return await this.openRouterAI.getAvailableModels();
  }

  /**
   * Estimate cost for an AI request
   */
  async estimateCost(model: string, prompt: string, maxTokens?: number): Promise<any> {
    return this.openRouterAI.estimateCost({
      model,
      prompt,
      maxTokens: maxTokens || 1000
    });
  }

  /**
   * Get request status
   */
  getRequestStatus(requestId: string): 'active' | 'completed' | 'not_found' {
    if (this.activeRequests.has(requestId)) {
      return 'active';
    }
    if (this.completedRequests.has(requestId)) {
      return 'completed';
    }
    return 'not_found';
  }

  /**
   * Get completed request
   */
  getCompletedRequest(requestId: string): AIServiceResponse | null {
    return this.completedRequests.get(requestId) || null;
  }

  /**
   * Get facilitator statistics
   */
  getStatistics(): {
    activeRequests: number;
    completedRequests: number;
    totalRevenue: number;
  } {
    const totalRevenue = Array.from(this.completedRequests.values())
      .reduce((sum, response) => sum + response.cost.amount, 0);

    return {
      activeRequests: this.activeRequests.size,
      completedRequests: this.completedRequests.size,
      totalRevenue
    };
  }

  /**
   * Get the facilitator wallet address
   */
  async getWalletAddress(): Promise<string> {
    return this.config.walletManager.getAddress();
  }

  /**
   * Get the current configuration
   */
  getConfig(): AIFacilitatorConfig {
    return this.config;
  }

  /**
   * Shutdown the facilitator
   */
  async shutdown(): Promise<void> {
    this.removeAllListeners();
    this.activeRequests.clear();
    this.completedRequests.clear();
  }
}