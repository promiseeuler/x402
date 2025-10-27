import * as express from 'express';
import axios from 'axios';
import { X402SDK } from '../src/index';

const app = express();
const PORT = 3002;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Global variables
let sdk: X402SDK;

// Initialize the client
async function initializeClient() {
  try {
    console.log('🚀 Initializing X402 Client...');
    
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
    
    console.log('✅ Client initialized successfully!');
    console.log(`📍 Client Address: ${address}`);
    console.log(`💰 Client Balance: ${balance} STT`);
    
  } catch (error) {
    console.error('❌ Failed to initialize client:', error);
    process.exit(1);
  }
}

// Helper function to make X402 payment
async function makePayment(amount: string, recipient: string, metadata?: any) {
  try {
    console.log(`💳 Making payment: ${amount} STT to ${recipient}`);
    console.log(`📝 Metadata:`, metadata || { source: 'standalone-client' });
    
    const result = await sdk.sendTransaction(
      'SOMNIA_TESTNET',
      recipient,
      amount
    );
    
    console.log('✅ Payment successful!');
    console.log(`🔗 Transaction Hash: ${result.hash}`);
    
    return { transactionHash: result.hash, ...result };
  } catch (error) {
    console.error('❌ Payment failed:', error);
    throw error;
  }
}

// Client API Routes

// Test connection to X402 server
app.get('/test-server', async (req, res) => {
  try {
    const serverUrl = req.query.server || 'http://localhost:3001';
    
    console.log(`🔍 Testing connection to server: ${serverUrl}`);
    
    // First, get server status
    const statusResponse = await axios.get(`${serverUrl}/status`);
    console.log('📊 Server status:', statusResponse.data);
    
    return res.json({
      success: true,
      message: 'Successfully connected to X402 server',
      serverStatus: statusResponse.data
    });
    
  } catch (error: any) {
    console.error('❌ Failed to connect to server:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to connect to server',
      details: error.message
    });
  }
});

// Make a paid request to the server
app.post('/request-data', async (req, res) => {
  try {
    const { serverUrl = 'http://localhost:3001', endpoint = '/api/data' } = req.body;
    const fullUrl = `${serverUrl}${endpoint}`;
    
    console.log(`🌐 Making request to: ${fullUrl}`);
    
    // First, try the request without payment to get payment details
    let response;
    try {
      response = await axios.get(fullUrl);
    } catch (error: any) {
      if (error.response && error.response.status === 402) {
        // Payment required - get payment details
        const paymentDetails = error.response.data.paymentDetails;
        console.log('💰 Payment required:', paymentDetails);
        
        // Make the payment
        const paymentResult = await makePayment(
          paymentDetails.amount,
          paymentDetails.recipient,
          { endpoint, serverUrl }
        );
        
        // Retry the request with payment proof
        response = await axios.get(fullUrl, {
          headers: {
            'x-payment-proof': paymentResult.transactionHash,
            'x-payment-amount': paymentDetails.amount
          }
        });
        
        return res.json({
          success: true,
          message: 'Request completed with payment',
          payment: {
            amount: paymentDetails.amount,
            transactionHash: paymentResult.transactionHash
          },
          data: response.data
        });
      } else {
        throw error;
      }
    }
    
    if (response && !res.headersSent) {
      // Request succeeded without payment (free endpoint)
      return res.json({
        success: true,
        message: 'Request completed (no payment required)',
        data: response.data
      });
    }
    
    // Fallback if no response or headers already sent
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'No response received'
      });
    }
    return; // Explicit return when headers already sent
    
  } catch (error: any) {
    console.error('❌ Request failed:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Request failed',
        details: error.message
      });
    }
    return; // Explicit return when headers already sent
  }
});

// Get client wallet status
app.get('/wallet-status', async (_req, res) => {
  try {
    const address = sdk.getWalletAddress();
    const balance = await sdk.getBalance('SOMNIA_TESTNET');
    
    res.json({
      address,
      balance: `${balance} STT`,
      network: 'SOMNIA_TESTNET',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get wallet status' });
  }
});

// Manual payment endpoint
app.post('/make-payment', async (req, res) => {
  try {
    const { amount, recipient, metadata } = req.body;
    
    if (!amount || !recipient) {
      return res.status(400).json({
        error: 'Amount and recipient are required'
      });
    }
    
    const result = await makePayment(amount, recipient, metadata);
    
    return res.json({
      success: true,
      message: 'Payment completed successfully',
      transactionHash: result.transactionHash,
      amount,
      recipient
    });
    
  } catch (error: any) {
    console.error('❌ Manual payment failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Payment failed',
      details: error.message
    });
  }
});

// Client status endpoint
app.get('/status', async (_req, res) => {
  try {
    const address = sdk.getWalletAddress();
    const balance = await sdk.getBalance('SOMNIA_TESTNET');
    
    res.json({
      status: 'running',
      client: 'X402 Payment Client',
      address,
      balance: `${balance} STT`,
      endpoints: {
        '/test-server': { description: 'Test connection to X402 server' },
        '/request-data': { description: 'Make paid request to server' },
        '/wallet-status': { description: 'Get wallet information' },
        '/make-payment': { description: 'Make manual payment' },
        '/status': { description: 'Client status' }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get client status' });
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve a simple HTML interface
app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>X402 Client Interface</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; }
            .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            button { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #005a87; }
            .result { background: #e8f5e8; padding: 10px; margin: 10px 0; border-radius: 5px; white-space: pre-wrap; }
            .error { background: #ffe8e8; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 X402 Payment Client</h1>
            <p>This client can make payments to X402-enabled servers.</p>
            
            <div class="endpoint">
                <h3>Test Server Connection</h3>
                <button onclick="testServer()">Test Connection</button>
                <div id="test-result"></div>
            </div>
            
            <div class="endpoint">
                <h3>Request Protected Data</h3>
                <button onclick="requestData('/api/data')">Request Basic Data (0.001 STT)</button>
                <button onclick="requestData('/api/premium-data')">Request Premium Data (0.005 STT)</button>
                <div id="request-result"></div>
            </div>
            
            <div class="endpoint">
                <h3>Wallet Status</h3>
                <button onclick="getWalletStatus()">Check Wallet</button>
                <div id="wallet-result"></div>
            </div>
        </div>
        
        <script>
            async function testServer() {
                const result = document.getElementById('test-result');
                try {
                    const response = await fetch('/test-server');
                    const data = await response.json();
                    result.className = 'result';
                    result.textContent = JSON.stringify(data, null, 2);
                } catch (error) {
                    result.className = 'result error';
                    result.textContent = 'Error: ' + error.message;
                }
            }
            
            async function requestData(endpoint) {
                const result = document.getElementById('request-result');
                try {
                    const response = await fetch('/request-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ endpoint })
                    });
                    const data = await response.json();
                    result.className = 'result';
                    result.textContent = JSON.stringify(data, null, 2);
                } catch (error) {
                    result.className = 'result error';
                    result.textContent = 'Error: ' + error.message;
                }
            }
            
            async function getWalletStatus() {
                const result = document.getElementById('wallet-result');
                try {
                    const response = await fetch('/wallet-status');
                    const data = await response.json();
                    result.className = 'result';
                    result.textContent = JSON.stringify(data, null, 2);
                } catch (error) {
                    result.className = 'result error';
                    result.textContent = 'Error: ' + error.message;
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Start the client
async function startClient() {
  await initializeClient();
  
  app.listen(PORT, () => {
    console.log('\n🌐 X402 Payment Client Started!');
    console.log('==================================');
    console.log(`🚀 Client running on: http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log(`   • GET / - Web interface`);
    console.log(`   • GET /status - Client status`);
    console.log(`   • GET /test-server - Test server connection`);
    console.log(`   • POST /request-data - Make paid request`);
    console.log(`   • GET /wallet-status - Wallet information`);
    console.log(`   • POST /make-payment - Manual payment`);
    console.log('\n💡 Open in browser:');
    console.log(`   http://localhost:${PORT}`);
    console.log('==================================\n');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down X402 client...');
  process.exit(0);
});

// Start the client
startClient().catch(error => {
  console.error('❌ Failed to start client:', error);
  process.exit(1);
});