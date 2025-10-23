import express from 'express';
import cors from 'cors';
import { createThirdwebClient, getContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { privateKeyToAccount } from 'thirdweb/wallets';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Somnia testnet configuration
const somniaTestnet = defineChain({
  id: parseInt(process.env.SOMNIA_CHAIN_ID),
  name: 'Somnia Testnet',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18,
  },
  rpc: process.env.SOMNIA_RPC_URL,
  blockExplorers: [
    {
      name: 'Shannon Explorer',
      url: process.env.SOMNIA_EXPLORER_URL,
    },
  ],
});

// Initialize Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID,
});

// Game state (simplified - treasures now handled by API)
let gameState = {
  payments: new Map(),
  playerProgress: new Map()
};

const TREASURE_API_URL = `http://localhost:${process.env.TREASURE_API_PORT || 4000}`;

// Proxy function to treasure API
async function proxyToTreasureAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${TREASURE_API_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    const data = await response.json();
    return { status: response.status, data, headers: response.headers };
  } catch (error) {
    console.error('Treasure API proxy error:', error);
    return {
      status: 500,
      data: { error: 'Treasure API unavailable', message: error.message }
    };
  }
}

// Get treasure information (proxied to treasure API)
app.get('/api/treasure/:id', async (req, res) => {
  const treasureId = req.params.id;
  const paymentId = req.headers['x-payment-id'];
  
  console.log(`Treasure request for ID: ${treasureId}, Payment ID: ${paymentId}`);
  
  const result = await proxyToTreasureAPI(`/api/treasure/${treasureId}`, {
    headers: {
      'x-payment-id': paymentId
    }
  });
  
  res.status(result.status).json(result.data);
});

// Get all treasures (proxied to treasure API)
app.get('/api/treasures', async (req, res) => {
  const paymentId = req.headers['x-payment-id'];
  
  const result = await proxyToTreasureAPI('/api/treasures', {
    headers: {
      'x-payment-id': paymentId
    }
  });
  
  res.status(result.status).json(result.data);
});

// X402 Verify endpoint (proxied to treasure API)
app.post('/api/verify', async (req, res) => {
  try {
    console.log('Proxying verify request to treasure API:', req.body);
    
    const result = await proxyToTreasureAPI('/api/verify', {
      method: 'POST',
      body: req.body
    });
    
    res.status(result.status).json(result.data);
    
  } catch (error) {
    console.error('Verification proxy error:', error);
    res.status(500).json({ 
      error: 'Verification failed',
      details: error.message 
    });
  }
});

// X402 Settle endpoint (proxied to treasure API)
app.post('/api/settle', async (req, res) => {
  try {
    console.log('Proxying settle request to treasure API:', req.body);
    
    const result = await proxyToTreasureAPI('/api/settle', {
      method: 'POST',
      body: req.body
    });
    
    res.status(result.status).json(result.data);
    
  } catch (error) {
    console.error('Settlement proxy error:', error);
    res.status(500).json({ 
      error: 'Settlement failed',
      details: error.message 
    });
  }
});

// Game state endpoints (simplified - treasures handled by API)
app.get('/api/game/state', async (req, res) => {
  try {
    const result = await proxyToTreasureAPI('/api/game/state');
    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get game state',
      paymentAmount: process.env.GAME_PAYMENT_AMOUNT,
      paymentToken: process.env.GAME_PAYMENT_TOKEN
    });
  }
});

app.get('/api/player/:address/progress', async (req, res) => {
  const playerAddress = req.params.address;
  
  try {
    const result = await proxyToTreasureAPI(`/api/player/${playerAddress}/progress`);
    res.status(result.status).json(result.data);
  } catch (error) {
    // Fallback to local progress if treasure API is unavailable
    const progress = gameState.playerProgress.get(playerAddress) || {
      treasuresFound: 0,
      totalSpent: 0,
      achievements: []
    };
    res.json(progress);
  }
});

// Reset game endpoint (proxied to treasure API)
app.post('/api/game/reset', async (req, res) => {
  try {
    const result = await proxyToTreasureAPI('/api/game/reset', {
      method: 'POST'
    });
    
    // Also reset local state
    gameState = {
      payments: new Map(),
      playerProgress: new Map()
    };
    
    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset game' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    chain: 'Somnia Testnet',
    chainId: process.env.SOMNIA_CHAIN_ID
  });
});

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎮 X402 Treasure Hunt Game Server running on port ${PORT}`);
  console.log(`🔗 Somnia Testnet RPC: ${process.env.SOMNIA_RPC_URL}`);
  console.log(`⛓️  Chain ID: ${process.env.SOMNIA_CHAIN_ID}`);
  console.log(`💰 Payment Amount: ${process.env.GAME_PAYMENT_AMOUNT} ${process.env.GAME_PAYMENT_TOKEN}`);
  console.log(`🌐 Game URL: http://localhost:${PORT}`);
});