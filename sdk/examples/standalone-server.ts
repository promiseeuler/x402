import express from 'express';
import cors from 'cors';
import { X402SDK } from '../src/index';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text());

// Global variables
let sdk: X402SDK;

// Initialize the server
async function initializeServer() {
  try {
    console.log('🚀 Initializing X402 Server...');
    
    // Initialize SDK
    sdk = new X402SDK({
      defaultNetwork: 'SOMNIA_TESTNET',
      wallet: {
        createRandom: true
      },
      spendingLimits: {
        maxPerRequest: '1.0',
        maxTotal: '100.0',
        windowSeconds: 3600,
        currentSpending: '0.0',
        windowStart: Date.now()
      },
      facilitator: {
        baseUrl: 'http://localhost:3003'
      }
    });
    
    await sdk.initializeWallet();
    
    const address = sdk.getWalletAddress();
    const balance = await sdk.getBalance('SOMNIA_TESTNET');
    
    console.log('✅ Server initialized successfully!');
    console.log(`📍 Server Address: ${address}`);
    console.log(`💰 Server Balance: ${balance} STT`);
    
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

// X402 Protected Routes

// Simple API endpoint that requires payment
app.get('/api/data', async (req, res) => {
  try {
    // Check for X402 payment header
    const paymentProof = req.headers['x-payment-proof'];
    const paymentAmount = req.headers['x-payment-amount'];
    
    if (!paymentProof || !paymentAmount) {
      // Return 402 Payment Required with payment details
      return res.status(402).json({
        error: 'Payment Required',
        message: 'This endpoint requires payment',
        paymentDetails: {
          amount: '0.001', // 0.001 STT
          currency: 'STT',
          recipient: sdk.getWalletAddress(),
          network: 'SOMNIA_TESTNET'
        }
      });
    }
    
    // Verify payment (simplified - in production you'd verify the transaction)
    console.log(`💳 Payment received: ${paymentAmount} STT`);
    console.log(`🔍 Payment proof: ${paymentProof}`);
    
    // Return the protected data
    res.json({
      success: true,
      data: {
        message: 'This is protected data that requires payment',
        timestamp: new Date().toISOString(),
        serverInfo: {
          address: sdk.getWalletAddress(),
          balance: await sdk.getBalance('SOMNIA_TESTNET')
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Premium API endpoint with higher payment requirement
app.get('/api/premium-data', async (req, res) => {
  try {
    const paymentProof = req.headers['x-payment-proof'];
    const paymentAmount = req.headers['x-payment-amount'];
    
    if (!paymentProof || !paymentAmount || parseFloat(paymentAmount as string) < 0.005) {
      return res.status(402).json({
        error: 'Payment Required',
        message: 'This premium endpoint requires higher payment',
        paymentDetails: {
          amount: '0.005', // 0.005 STT
          currency: 'STT',
          recipient: sdk.getWalletAddress(),
          network: 'SOMNIA_TESTNET'
        }
      });
    }
    
    console.log(`💎 Premium payment received: ${paymentAmount} STT`);
    
    res.json({
      success: true,
      data: {
        message: 'This is premium protected data',
        premiumFeatures: [
          'Advanced analytics',
          'Real-time updates',
          'Priority support'
        ],
        timestamp: new Date().toISOString(),
        serverInfo: {
          address: sdk.getWalletAddress(),
          balance: await sdk.getBalance('SOMNIA_TESTNET')
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing premium request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Server status endpoint (free)
app.get('/status', async (_req, res) => {
  try {
    const address = sdk.getWalletAddress();
    const balance = await sdk.getBalance('SOMNIA_TESTNET');
    
    res.json({
      status: 'running',
      server: 'X402 Payment Server',
      address,
      balance: `${balance} STT`,
      endpoints: {
        '/api/data': { price: '0.001 STT', description: 'Basic protected data' },
        '/api/premium-data': { price: '0.005 STT', description: 'Premium protected data' },
        '/status': { price: 'Free', description: 'Server status' }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get server status' });
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start the server
async function startServer() {
  await initializeServer();
  
  app.listen(PORT, () => {
    console.log('\n🌐 X402 Payment Server Started!');
    console.log('==================================');
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log(`   • GET /status - Server status (Free)`);
    console.log(`   • GET /health - Health check (Free)`);
    console.log(`   • GET /api/data - Protected data (0.001 STT)`);
    console.log(`   • GET /api/premium-data - Premium data (0.005 STT)`);
    console.log('\n💡 Test with:');
    console.log(`   curl http://localhost:${PORT}/status`);
    console.log(`   curl http://localhost:${PORT}/api/data`);
    console.log('==================================\n');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down X402 server...');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});