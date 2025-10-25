/**
 * X402 Resource Server Demo
 * 
 * This server demonstrates how a resource server integrates with
 * an x402 facilitator to require and verify payments for API access.
 * 
 * Reference: https://x402.gitbook.io/x402
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.RESOURCE_PORT || 3004;
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'http://localhost:3003';

// Middleware
app.use(cors());
app.use(express.json());

// Payment configuration
const PAYMENT_CONFIG = {
  amount: '1000000', // 1 USDC (6 decimals)
  token: '0xA0b86a33E6441b8dB4B2f8b8C4b4b4b4b4b4b4b4', // Mock USDC address
  recipient: '0x742d35Cc6634C0532925a3b8D4b4b4b4b4b4b4b4', // Resource server wallet
  scheme: 'transferWithAuthorization',
  networkId: '8453' // Base mainnet
};

// Mock protected resources
const PROTECTED_RESOURCES = {
  '/api/premium-data': {
    description: 'Premium market data feed',
    data: {
      btc_price: 67500.00,
      eth_price: 2650.00,
      market_cap: 2.1e12,
      volume_24h: 45.2e9,
      timestamp: new Date().toISOString()
    }
  },
  '/api/ai-analysis': {
    description: 'AI-powered market analysis',
    data: {
      sentiment: 'bullish',
      confidence: 0.85,
      key_factors: ['institutional_adoption', 'regulatory_clarity', 'technical_indicators'],
      prediction: 'Price likely to increase 5-10% in next 7 days',
      timestamp: new Date().toISOString()
    }
  },
  '/api/exclusive-report': {
    description: 'Exclusive research report',
    data: {
      title: 'Q4 2024 Crypto Market Outlook',
      summary: 'Comprehensive analysis of market trends and opportunities',
      key_insights: [
        'DeFi protocols showing strong growth',
        'Layer 2 solutions gaining traction',
        'Institutional interest remains high'
      ],
      full_report_url: 'https://example.com/reports/q4-2024',
      timestamp: new Date().toISOString()
    }
  }
};

/**
 * Middleware to check for X402 payment
 */
const requirePayment = async (req, res, next) => {
  const paymentHeader = req.headers['x-payment'];
  
  // If no payment header, return 402 Payment Required
  if (!paymentHeader) {
    console.log('❌ No payment header found, returning 402');
    return res.status(402).json({
      error: 'Payment Required',
      message: 'This resource requires payment to access',
      accepts: [{
        scheme: PAYMENT_CONFIG.scheme,
        amount: PAYMENT_CONFIG.amount,
        token: PAYMENT_CONFIG.token,
        recipient: PAYMENT_CONFIG.recipient,
        networkId: PAYMENT_CONFIG.networkId,
        description: `Payment required for ${req.path}`
      }]
    });
  }
  
  try {
    // Parse payment payload from header
    console.log('🔍 Raw payment header:', paymentHeader);
    const decodedPayload = Buffer.from(paymentHeader, 'base64').toString();
    console.log('🔍 Decoded payload string:', decodedPayload);
    const paymentPayload = JSON.parse(decodedPayload);
    console.log('💳 Payment received:', {
      scheme: paymentPayload.scheme,
      amount: paymentPayload.amount,
      token: paymentPayload.token
    });
    console.log('💳 Full payment payload:', paymentPayload);
    
    // Verify payment with facilitator
    const verificationResponse = await axios.post(`${FACILITATOR_URL}/verify`, {
      paymentPayload,
      paymentDetails: PAYMENT_CONFIG
    });
    
    if (verificationResponse.data.valid) {
      console.log('✅ Payment verified successfully');
      
      // Settle payment with facilitator
      const settlementResponse = await axios.post(`${FACILITATOR_URL}/settle`, {
        paymentPayload,
        paymentDetails: PAYMENT_CONFIG
      });
      
      if (settlementResponse.data.success) {
        console.log('💰 Payment settled successfully:', settlementResponse.data.transactionHash);
        
        // Add settlement info to response headers
        res.set('X-Payment-Response', Buffer.from(JSON.stringify({
          transactionHash: settlementResponse.data.transactionHash,
          blockNumber: settlementResponse.data.blockNumber,
          status: settlementResponse.data.status
        })).toString('base64'));
        
        // Payment successful, continue to resource
        next();
      } else {
        console.log('❌ Payment settlement failed');
        return res.status(402).json({
          error: 'Payment settlement failed',
          message: 'Payment could not be processed'
        });
      }
    } else {
      console.log('❌ Payment verification failed:', verificationResponse.data.error);
      return res.status(402).json({
        error: 'Invalid payment',
        message: verificationResponse.data.error
      });
    }
    
  } catch (error) {
    console.error('Error processing payment:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Payment facilitator is not available'
      });
    }
    
    return res.status(402).json({
      error: 'Payment processing error',
      message: 'Unable to process payment'
    });
  }
};

/**
 * Protected API endpoints
 */
Object.keys(PROTECTED_RESOURCES).forEach(path => {
  app.get(path, requirePayment, (req, res) => {
    const resource = PROTECTED_RESOURCES[path];
    console.log(`📊 Serving protected resource: ${path}`);
    
    res.json({
      success: true,
      resource: path,
      description: resource.description,
      data: resource.data,
      payment_verified: true,
      served_at: new Date().toISOString()
    });
  });
});

/**
 * GET /api/catalog
 * 
 * Public endpoint that lists available paid resources
 */
app.get('/api/catalog', (req, res) => {
  const catalog = Object.keys(PROTECTED_RESOURCES).map(path => ({
    endpoint: path,
    description: PROTECTED_RESOURCES[path].description,
    payment_required: {
      amount: PAYMENT_CONFIG.amount,
      token: PAYMENT_CONFIG.token,
      scheme: PAYMENT_CONFIG.scheme,
      networkId: PAYMENT_CONFIG.networkId
    }
  }));
  
  res.json({
    service: 'X402 Resource Server',
    description: 'Demo server with paid API endpoints',
    available_resources: catalog,
    payment_facilitator: FACILITATOR_URL
  });
});

/**
 * GET /health
 * 
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'x402-resource-server',
    facilitator_url: FACILITATOR_URL,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /
 * 
 * Root endpoint with server information
 */
app.get('/', (req, res) => {
  res.json({
    service: 'X402 Resource Server Demo',
    description: 'Demonstrates x402 payment-gated API endpoints',
    version: '1.0.0',
    endpoints: {
      '/api/catalog': 'GET - List available paid resources (public)',
      '/api/premium-data': 'GET - Premium market data (requires payment)',
      '/api/ai-analysis': 'GET - AI market analysis (requires payment)',
      '/api/exclusive-report': 'GET - Exclusive research report (requires payment)',
      '/health': 'GET - Health check'
    },
    payment_config: PAYMENT_CONFIG,
    facilitator_url: FACILITATOR_URL,
    documentation: 'https://x402.gitbook.io/x402'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 X402 Resource Server running on port ${PORT}`);
  console.log(`🔗 Using facilitator at: ${FACILITATOR_URL}`);
  console.log(`📋 API catalog: http://localhost:${PORT}/api/catalog`);
  console.log(`📚 Documentation: https://x402.gitbook.io/x402`);
});

module.exports = app;