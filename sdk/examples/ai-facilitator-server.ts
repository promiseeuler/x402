/**
 * AI Facilitator Server Example
 * Demonstrates how to run a standalone AI facilitator for platform integration
 */

import express from 'express';
import cors from 'cors';
import { AIFacilitator, EmbeddedWalletManager } from '../src';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI Facilitator
let aiFacilitator: AIFacilitator;

async function initializeFacilitator() {
  try {
    // Initialize wallet manager with environment variables
    const walletManager = new EmbeddedWalletManager({
      privateKey: process.env.FACILITATOR_PRIVATE_KEY || '',
      network: 'SOMNIA_TESTNET',
      password: process.env.WALLET_PASSWORD || 'default-password'
    });

    // Initialize AI Facilitator
    aiFacilitator = new AIFacilitator({
      walletManager,
      openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
      network: 'SOMNIA_TESTNET',
      spendingLimits: {
        maxPerRequest: '10',
        maxTotal: '100',
        daily: '100',
        windowSeconds: 86400,
        currentSpending: '0',
        windowStart: Date.now()
      },
      debug: true
    });

    // Set up event listeners
    aiFacilitator.on('requestStarted', (request) => {
      console.log(`🚀 AI request started: ${request.id}`);
    });

    aiFacilitator.on('costCalculated', (data) => {
      console.log(`💰 Cost calculated for ${data.requestId}: ${data.cost.totalCost} STT`);
    });

    aiFacilitator.on('paymentInitiated', (payment) => {
      console.log(`💳 Payment initiated: ${payment.transactionHash}`);
    });

    aiFacilitator.on('paymentCompleted', (payment) => {
      console.log(`✅ Payment completed: ${payment.transactionHash}`);
    });

    aiFacilitator.on('requestCompleted', (response) => {
      console.log(`🎉 AI request completed: ${response.id}`);
    });

    aiFacilitator.on('requestFailed', (data) => {
      console.error(`❌ AI request failed: ${data.requestId} - ${data.error}`);
    });

    console.log('✅ AI Facilitator initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize AI Facilitator:', error);
    process.exit(1);
  }
}

// API Routes

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get available AI models
app.get('/api/models', async (_req, res) => {
  try {
    const models = await aiFacilitator.getAvailableModels();
    res.json({ success: true, models });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Estimate cost for AI request
app.post('/api/estimate', async (req, res) => {
  try {
    const { model, prompt, maxTokens } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Model and prompt are required' 
      });
    }

    const paymentDetails = await aiFacilitator.estimateCost(model, prompt, maxTokens);
    
    // Transform PaymentDetails to CostEstimate format
    const cost = {
      promptTokens: Math.ceil((prompt.length / 4)), // Rough estimate: 4 chars per token
      estimatedCompletionTokens: maxTokens || 1000,
      totalCost: paymentDetails.amount,
      currency: paymentDetails.currency
    };
    
    return res.json({ success: true, cost });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Process AI request with payment
app.post('/api/request', async (req, res) => {
  try {
    const { model, prompt, maxTokens, temperature, userId, metadata } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Model and prompt are required' 
      });
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const aiRequest = {
      id: requestId,
      model,
      prompt,
      maxTokens,
      temperature,
      userId,
      metadata
    };

    const response = await aiFacilitator.processAIRequest(aiRequest);
    return res.json({ success: true, response });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Verify payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { transactionHash } = req.body;
    
    if (!transactionHash) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transaction hash is required' 
      });
    }

    const verification = await aiFacilitator.verifyPayment(transactionHash);
    return res.json({ success: true, verification });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get request status
app.get('/api/request/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const status = aiFacilitator.getRequestStatus(id);
    
    if (status === 'not_found') {
      return res.status(404).json({ 
        success: false, 
        error: 'Request not found' 
      });
    }

    let response: any = { success: true, status };
    
    if (status === 'completed') {
      const completedRequest = aiFacilitator.getCompletedRequest(id);
      response.data = completedRequest;
    }

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get facilitator statistics
app.get('/api/stats', (_req, res) => {
  try {
    const stats = aiFacilitator.getStatistics();
    return res.json({ success: true, stats });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', error);
  return res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use((_req, res) => {
  return res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down AI Facilitator server...');
  
  if (aiFacilitator) {
    await aiFacilitator.shutdown();
  }
  
  process.exit(0);
});

// Start server
async function startServer() {
  await initializeFacilitator();
  
  app.listen(PORT, () => {
    console.log(`🚀 AI Facilitator server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 API docs: http://localhost:${PORT}/api`);
    console.log('\n📋 Available endpoints:');
    console.log('  GET  /health - Health check');
    console.log('  GET  /api/models - Get available AI models');
    console.log('  POST /api/estimate - Estimate cost for AI request');
    console.log('  POST /api/request - Process AI request with payment');
    console.log('  POST /api/verify-payment - Verify payment');
    console.log('  GET  /api/request/:id/status - Get request status');
    console.log('  GET  /api/stats - Get facilitator statistics');
  });
}

startServer().catch(console.error);