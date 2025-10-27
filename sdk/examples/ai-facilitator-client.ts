/**
 * AI Facilitator Client Example
 * Demonstrates how to integrate with an AI facilitator server
 */

import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables
config();

const FACILITATOR_URL = process.env.FACILITATOR_URL || 'http://localhost:3001';

interface AIModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
}

interface CostEstimate {
  promptTokens: number;
  estimatedCompletionTokens: number;
  totalCost: number;
  currency: string;
}

interface AIResponse {
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
  timestamp: string;
}

class AIFacilitatorClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the facilitator server is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<AIModel[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/models`);
      return response.data.models;
    } catch (error: any) {
      throw new Error(`Failed to get models: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Estimate cost for an AI request
   */
  async estimateCost(model: string, prompt: string, maxTokens?: number): Promise<CostEstimate> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/estimate`, {
        model,
        prompt,
        maxTokens
      });
      return response.data.cost;
    } catch (error: any) {
      throw new Error(`Failed to estimate cost: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Make an AI request with payment
   */
  async makeAIRequest(
    model: string, 
    prompt: string, 
    options?: {
      maxTokens?: number;
      temperature?: number;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<AIResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/request`, {
        model,
        prompt,
        ...options
      });
      return response.data.response;
    } catch (error: any) {
      throw new Error(`Failed to make AI request: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Verify a payment
   */
  async verifyPayment(transactionHash: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/verify-payment`, {
        transactionHash
      });
      return response.data.verification;
    } catch (error: any) {
      throw new Error(`Failed to verify payment: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get request status
   */
  async getRequestStatus(requestId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/request/${requestId}/status`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get request status: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get facilitator statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/stats`);
      return response.data.stats;
    } catch (error: any) {
      throw new Error(`Failed to get statistics: ${error.response?.data?.error || error.message}`);
    }
  }
}

// Example usage
async function demonstrateAIFacilitator() {
  const client = new AIFacilitatorClient(FACILITATOR_URL);

  try {
    console.log('🔍 Checking facilitator health...');
    const isHealthy = await client.checkHealth();
    if (!isHealthy) {
      throw new Error('Facilitator server is not healthy');
    }
    console.log('✅ Facilitator is healthy');

    console.log('\n📋 Getting available AI models...');
    const models = await client.getAvailableModels();
    console.log(`Found ${models.length} available models:`);
    models.forEach(model => {
      console.log(`  - ${model.name} (${model.id})`);
    });

    // Use the first available model for demonstration
    const selectedModel = models[0];
    if (!selectedModel) {
      throw new Error('No AI models available');
    }

    const prompt = 'Explain quantum computing in simple terms.';
    console.log(`\n💰 Estimating cost for prompt: "${prompt}"`);
    const costEstimate = await client.estimateCost(selectedModel.id, prompt, 500);
    console.log(`Estimated cost: ${costEstimate.totalCost} ${costEstimate.currency}`);
    console.log(`Estimated tokens: ${costEstimate.promptTokens} prompt + ${costEstimate.estimatedCompletionTokens} completion`);

    console.log('\n🚀 Making AI request with payment...');
    const aiResponse = await client.makeAIRequest(selectedModel.id, prompt, {
      maxTokens: 500,
      temperature: 0.7,
      userId: 'demo-user',
      metadata: { source: 'cli-demo' }
    });

    console.log('\n🎉 AI Response received:');
    console.log(`Request ID: ${aiResponse.id}`);
    console.log(`Content: ${aiResponse.content.substring(0, 200)}...`);
    console.log(`Usage: ${aiResponse.usage.totalTokens} tokens`);
    console.log(`Cost: ${aiResponse.cost.amount} ${aiResponse.cost.currency}`);
    if (aiResponse.transactionHash) {
      console.log(`Transaction: ${aiResponse.transactionHash}`);
    }

    if (aiResponse.transactionHash) {
      console.log('\n🔍 Verifying payment...');
      const verification = await client.verifyPayment(aiResponse.transactionHash);
      console.log(`Payment verified: ${verification.verified}`);
      console.log(`Amount: ${verification.amount} ${verification.currency}`);
    }

    console.log('\n📊 Getting facilitator statistics...');
    const stats = await client.getStatistics();
    console.log(`Active requests: ${stats.activeRequests}`);
    console.log(`Completed requests: ${stats.completedRequests}`);
    console.log(`Total revenue: ${stats.totalRevenue} STT`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Integration example for web applications
class WebAppIntegration {
  private client: AIFacilitatorClient;

  constructor(facilitatorUrl: string) {
    this.client = new AIFacilitatorClient(facilitatorUrl);
  }

  /**
   * Handle user AI request in a web application
   */
  async handleUserRequest(userPrompt: string, selectedModel: string): Promise<{
    success: boolean;
    response?: AIResponse;
    error?: string;
  }> {
    try {
      // First, estimate the cost
      const costEstimate = await this.client.estimateCost(selectedModel, userPrompt);
      
      // In a real app, you would show this cost to the user for confirmation
      console.log(`Cost will be: ${costEstimate.totalCost} ${costEstimate.currency}`);
      
      // Make the AI request
      const response = await this.client.makeAIRequest(selectedModel, userPrompt, {
        maxTokens: 1000,
        temperature: 0.7
      });
      
      return { success: true, response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's request history (in a real app, this would be filtered by user ID)
   */
  async getUserStats(): Promise<any> {
    return await this.client.getStatistics();
  }
}

// Run the demonstration
if (require.main === module) {
  console.log('🤖 AI Facilitator Client Demo');
  console.log('==============================\n');
  
  demonstrateAIFacilitator()
    .then(() => {
      console.log('\n✅ Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error.message);
      process.exit(1);
    });
}

export { AIFacilitatorClient, WebAppIntegration };