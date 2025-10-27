/**
 * OpenRouter AI Service with X402 Payment Integration
 * Handles AI requests through OpenRouter API with automatic payment processing
 */

import axios from 'axios';
import { X402Protocol } from '../protocol/X402Protocol';
import { NetworkName } from '../types/network';

export interface OpenRouterConfig {
  /** OpenRouter API key */
  apiKey: string;
  /** Base URL for OpenRouter API */
  baseUrl?: string;
  /** Default model to use */
  defaultModel?: string;
  /** Cost per request in STT tokens */
  costPerRequest?: number;
  /** Payment network */
  network?: NetworkName;
}

export interface AIRequest {
  /** The prompt/question to send to the AI */
  prompt: string;
  /** Model to use (optional, uses default if not specified) */
  model?: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for response randomness (0-1) */
  temperature?: number;
  /** Custom cost override */
  customCost?: number;
}

export interface AIResponse {
  /** The AI's response content */
  content: string;
  /** Model used for the request */
  model: string;
  /** Token usage information */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Transaction hash for the payment */
  transactionHash?: string;
  /** Timestamp of the response */
  timestamp: Date;
}

export interface PaymentDetails {
  /** Amount to be paid */
  amount: number;
  /** Currency/token symbol */
  currency: string;
  /** Network for payment */
  network: NetworkName;
  /** Payment description */
  description: string;
}

export class OpenRouterAI {
  private config: OpenRouterConfig;
  private x402Protocol: X402Protocol;
  private baseUrl: string;

  constructor(config: OpenRouterConfig, x402Protocol: X402Protocol) {
    this.config = {
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'anthropic/claude-3-haiku',
      costPerRequest: 0.001, // 0.001 STT per request
      network: 'SOMNIA_TESTNET',
      ...config
    };
    this.x402Protocol = x402Protocol;
    this.baseUrl = this.config.baseUrl!;
  }

  /**
   * Calculate the cost for an AI request
   */
  calculateCost(request: AIRequest): PaymentDetails {
    const baseCost = request.customCost || this.config.costPerRequest!;
    
    // Adjust cost based on model complexity
    let modelMultiplier = 1;
    if (request.model) {
      if (request.model.includes('gpt-4') || request.model.includes('claude-3-opus')) {
        modelMultiplier = 3;
      } else if (request.model.includes('gpt-3.5') || request.model.includes('claude-3-sonnet')) {
        modelMultiplier = 1.5;
      }
    }

    // Adjust cost based on max tokens
    const tokenMultiplier = request.maxTokens ? Math.max(1, request.maxTokens / 1000) : 1;

    const finalCost = baseCost * modelMultiplier * tokenMultiplier;

    return {
      amount: finalCost,
      currency: 'STT',
      network: this.config.network!,
      description: `AI request to ${request.model || this.config.defaultModel}`
    };
  }

  /**
   * Make a paid AI request through OpenRouter
   */
  async makeRequest(request: AIRequest): Promise<AIResponse> {
    try {
      // Prepare the OpenRouter request
      const openRouterRequest = {
        model: request.model || this.config.defaultModel,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7
      };

      // Make the request through X402 protocol
      // This will handle the payment automatically based on 402 responses
      const response = await this.x402Protocol.request({
        url: `${this.baseUrl}/chat/completions`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://x402.ai',
          'X-Title': 'X402 AI Payment System'
        },
        data: openRouterRequest
      });

      // Extract the AI response
      const aiResponseText = response.data?.choices?.[0]?.message?.content || 'No response received';

      return {
        content: aiResponseText,
        model: request.model || this.config.defaultModel!,
        usage: {
          promptTokens: response.data?.usage?.prompt_tokens || 0,
          completionTokens: response.data?.usage?.completion_tokens || 0,
          totalTokens: response.data?.usage?.total_tokens || 0
        },
        transactionHash: response.payment?.transactionHash,
        timestamp: new Date()
      };

    } catch (error: any) {
      // Handle different types of errors
      if (error.code === 'INSUFFICIENT_BALANCE') {
        throw new Error('Insufficient balance to make AI request. Please add funds to your wallet.');
      } else if (error.code === 'PAYMENT_FAILED') {
        throw new Error('Payment failed. Please check your wallet and try again.');
      } else if (error.code === 'SPENDING_LIMIT_EXCEEDED') {
        throw new Error('Spending limit exceeded. Please adjust your limits or wait for the next period.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid OpenRouter API key. Please check your configuration.');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making another request.');
      } else {
        throw new Error(`AI request failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      return [];
    }
  }

  /**
   * Estimate cost for a request without making it
   */
  estimateCost(request: AIRequest): PaymentDetails {
    return this.calculateCost(request);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OpenRouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenRouterConfig {
    return { ...this.config };
  }
}