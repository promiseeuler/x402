const express = require('express');
const cors = require('cors');
const { createThirdwebClient } = require('thirdweb');
const { getRpcClient } = require('thirdweb/rpc');
require('dotenv').config();

const app = express();
const PORT = process.env.TREASURE_API_PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Debug middleware to log verification requests specifically
app.use('/api/verify', (req, res, next) => {
  console.log('VERIFY REQUEST DETAILS:');
  console.log('Request body:', req.body);
  console.log('transactionHash present:', !!req.body.transactionHash);
  console.log('treasureId present:', !!req.body.treasureId);
  console.log('treasureId value:', req.body.treasureId);
  next();
});

// Thirdweb client for blockchain verification
const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});

// Somnia testnet configuration
const SOMNIA_CHAIN_ID = 50312;
const SOMNIA_RPC_URL = 'https://dream-rpc.somnia.network';
const PAYMENT_AMOUNT = '1'; // 1 STT
const SERVER_WALLET = process.env.SERVER_WALLET_ADDRESS;

// In-memory storage for verified payments (use database in production)
const verifiedPayments = new Map();

// Treasure data - only accessible after payment
const treasureDatabase = {
  'treasure_1': {
    id: 'treasure_1',
    name: 'Golden Compass',
    description: 'A mystical compass that always points to the nearest treasure.',
    rarity: 'Legendary',
    value: 1000,
    coordinates: { x: 150, y: 200 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The compass whispers: "Follow the stars to find the ancient vault."',
    hiddenAttributes: {
      magicalPower: 'Navigation Enhancement',
      enchantment: 'Treasure Seeking +50%',
      origin: 'Crafted by the legendary explorer Captain Goldbeard'
    }
  },
  'treasure_2': {
    id: 'treasure_2',
    name: 'Crystal of Wisdom',
    description: 'An ancient crystal containing the knowledge of forgotten civilizations.',
    rarity: 'Epic',
    value: 750,
    coordinates: { x: 300, y: 150 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The crystal reveals: "Knowledge is the greatest treasure of all."',
    hiddenAttributes: {
      magicalPower: 'Wisdom Enhancement',
      enchantment: 'Experience Gain +25%',
      origin: 'Found in the ruins of the Library of Alexandria'
    }
  },
  'treasure_3': {
    id: 'treasure_3',
    name: 'Phoenix Feather',
    description: 'A rare feather from the legendary Phoenix, glowing with eternal fire.',
    rarity: 'Mythical',
    value: 1500,
    coordinates: { x: 100, y: 350 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The feather burns with the message: "Rebirth comes to those who dare."',
    hiddenAttributes: {
      magicalPower: 'Resurrection',
      enchantment: 'Fire Resistance +100%',
      origin: 'Gifted by the Phoenix of Mount Olympus'
    }
  },
  'treasure_4': {
    id: 'treasure_4',
    name: 'Dragon Scale Shield',
    description: 'An impenetrable shield forged from the scales of an ancient dragon.',
    rarity: 'Legendary',
    value: 1200,
    coordinates: { x: 450, y: 280 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The shield echoes: "Protection comes to the brave-hearted."',
    hiddenAttributes: {
      magicalPower: 'Ultimate Defense',
      enchantment: 'Damage Reduction +75%',
      origin: 'Forged in the fires of Mount Dragonspire'
    }
  },
  'treasure_5': {
    id: 'treasure_5',
    name: 'Moonstone Amulet',
    description: 'A shimmering amulet that channels the power of the moon.',
    rarity: 'Epic',
    value: 800,
    coordinates: { x: 200, y: 400 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The moonstone glows: "Night reveals what day conceals."',
    hiddenAttributes: {
      magicalPower: 'Lunar Magic',
      enchantment: 'Night Vision +100%',
      origin: 'Blessed by the Moon Goddess Selene'
    }
  },
  'treasure_6': {
    id: 'treasure_6',
    name: 'Thunderbolt Spear',
    description: 'A legendary spear that crackles with the power of lightning.',
    rarity: 'Mythical',
    value: 1800,
    coordinates: { x: 380, y: 120 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The spear thunders: "Strike swift as lightning, true as thunder."',
    hiddenAttributes: {
      magicalPower: 'Lightning Strike',
      enchantment: 'Electric Damage +200%',
      origin: 'Wielded by Zeus himself in ancient times'
    }
  },
  'treasure_7': {
    id: 'treasure_7',
    name: 'Emerald of Life',
    description: 'A vibrant emerald that pulses with the essence of nature.',
    rarity: 'Epic',
    value: 900,
    coordinates: { x: 80, y: 180 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The emerald whispers: "Life finds a way through all obstacles."',
    hiddenAttributes: {
      magicalPower: 'Nature Healing',
      enchantment: 'Health Regeneration +50%',
      origin: 'Grown in the heart of the Eternal Forest'
    }
  },
  'treasure_8': {
    id: 'treasure_8',
    name: 'Shadow Cloak',
    description: 'A mysterious cloak that bends light and shadow to its will.',
    rarity: 'Legendary',
    value: 1100,
    coordinates: { x: 320, y: 320 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The shadows murmur: "Invisibility is the greatest weapon."',
    hiddenAttributes: {
      magicalPower: 'Shadow Manipulation',
      enchantment: 'Stealth +90%',
      origin: 'Woven by the Shadow Weavers of the Void'
    }
  },
  'treasure_9': {
    id: 'treasure_9',
    name: 'Frost Crown',
    description: 'A crown of eternal ice that never melts, radiating cold power.',
    rarity: 'Mythical',
    value: 2000,
    coordinates: { x: 250, y: 50 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The crown chills: "Rule with the calm of winter, the power of ice."',
    hiddenAttributes: {
      magicalPower: 'Ice Dominion',
      enchantment: 'Frost Damage +150%',
      origin: 'Forged in the Frozen Throne of the Ice Queen'
    }
  },
  'treasure_10': {
    id: 'treasure_10',
    name: 'Starlight Orb',
    description: 'A celestial orb containing the concentrated light of a thousand stars.',
    rarity: 'Legendary',
    value: 1300,
    coordinates: { x: 420, y: 380 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The stars sing: "Light conquers all darkness, hope conquers all despair."',
    hiddenAttributes: {
      magicalPower: 'Stellar Energy',
      enchantment: 'Light Magic +80%',
      origin: 'Gifted by the Star Council of the Cosmos'
    }
  },
  'treasure_11': {
    id: 'treasure_11',
    name: 'Ancient Tome',
    description: 'A weathered book containing spells and secrets from the dawn of magic.',
    rarity: 'Epic',
    value: 700,
    coordinates: { x: 180, y: 300 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The tome reveals: "Magic is not power, but understanding."',
    hiddenAttributes: {
      magicalPower: 'Arcane Knowledge',
      enchantment: 'Spell Power +40%',
      origin: 'Written by the first Archmage Merlin'
    }
  },
  'treasure_12': {
    id: 'treasure_12',
    name: 'Ruby of Passion',
    description: 'A fiery ruby that burns with the intensity of pure emotion.',
    rarity: 'Epic',
    value: 850,
    coordinates: { x: 350, y: 250 },
    discoveredAt: new Date().toISOString(),
    secretMessage: 'The ruby blazes: "Passion fuels the greatest achievements."',
    hiddenAttributes: {
      magicalPower: 'Emotional Amplification',
      enchantment: 'Critical Hit +60%',
      origin: 'Formed in the heart of a volcano by pure love'
    }
  }
};

// X402 Payment Middleware
function x402PaymentRequired(req, res, next) {
  const treasureId = req.params.treasureId || req.query.treasureId;
  const paymentProof = req.headers['x402-payment-proof'];
  
  if (!paymentProof) {
    // Return HTTP 402 Payment Required with X402 headers
    return res.status(402).set({
      'X402-Payment-Required': 'true',
      'X402-Amount': PAYMENT_AMOUNT,
      'X402-Currency': 'STT',
      'X402-Recipient': SERVER_WALLET,
      'X402-Chain-ID': SOMNIA_CHAIN_ID.toString(),
      'X402-RPC-URL': SOMNIA_RPC_URL,
      'X402-Description': `Payment required to access treasure ${treasureId}`,
      'X402-Verify-URL': `http://localhost:${PORT}/api/verify`,
      'X402-Settle-URL': `http://localhost:${PORT}/api/settle`,
      'Content-Type': 'application/json'
    }).json({
      error: 'Payment Required',
      message: 'This treasure requires payment to access',
      payment: {
        amount: PAYMENT_AMOUNT,
        currency: 'STT',
        recipient: SERVER_WALLET,
        chainId: SOMNIA_CHAIN_ID,
        rpcUrl: SOMNIA_RPC_URL,
        description: `Access to treasure ${treasureId}`
      },
      endpoints: {
        verify: `http://localhost:${PORT}/api/verify`,
        settle: `http://localhost:${PORT}/api/settle`
      }
    });
  }
  
  // Check if payment is verified
  if (!verifiedPayments.has(paymentProof)) {
    return res.status(402).json({
      error: 'Payment Not Verified',
      message: 'Payment proof is invalid or not verified',
      verifyUrl: `http://localhost:${PORT}/api/verify`
    });
  }
  
  // Payment verified, proceed
  req.paymentProof = paymentProof;
  req.paymentData = verifiedPayments.get(paymentProof);
  next();
}

// Verify payment endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { transactionHash, treasureId, walletAddress } = req.body;
    
    // Enhanced parameter validation
    if (!transactionHash || !treasureId || !walletAddress) {
      console.log('❌ Missing parameters:', { transactionHash: !!transactionHash, treasureId: !!treasureId, walletAddress: !!walletAddress });
      return res.status(400).json({
        error: 'Missing Parameters',
        message: 'Transaction hash, treasure ID, and wallet address are required',
        received: { transactionHash: !!transactionHash, treasureId: !!treasureId, walletAddress: !!walletAddress }
      });
    }
    
    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      console.log('❌ Invalid transaction hash format:', transactionHash);
      return res.status(400).json({
        error: 'Invalid Transaction Hash',
        message: 'Transaction hash must be a valid 64-character hex string starting with 0x'
      });
    }
    
    // Validate treasure ID
    if (!treasureDatabase[treasureId]) {
      console.log('❌ Invalid treasure ID:', treasureId);
      return res.status(400).json({
        error: 'Invalid Treasure ID',
        message: 'The specified treasure ID does not exist'
      });
    }
    
    // Check if payment already verified
    const existingPayment = Array.from(verifiedPayments.values()).find(
      payment => payment.transactionHash === transactionHash
    );
    
    if (existingPayment) {
      console.log('✅ Payment already verified:', transactionHash);
      const paymentProof = Array.from(verifiedPayments.entries()).find(
        ([key, value]) => value.transactionHash === transactionHash
      )?.[0];
      
      return res.json({
        success: true,
        paymentProof,
        message: 'Payment already verified',
        accessToken: paymentProof
      });
    }
    
    console.log('🔍 Starting verification for:', { transactionHash, treasureId });
    
    // Verify transaction on Somnia blockchain with retry mechanism
    let isValid = false;
    let verificationError = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Verification attempt ${attempt}/3`);
        isValid = await verifyTransaction(transactionHash);
        if (isValid) break;
        
        if (attempt < 3) {
          console.log(`⏳ Waiting 2 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        verificationError = error;
        console.log(`❌ Verification attempt ${attempt} failed:`, error.message);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!isValid) {
      console.log('❌ Transaction verification failed after 3 attempts');
      return res.status(400).json({
        error: 'Invalid Transaction',
        message: 'Transaction could not be verified on the blockchain after multiple attempts',
        details: verificationError?.message || 'Unknown verification error'
      });
    }
    
    // Store verified payment
    const paymentProof = `payment_${transactionHash}_${Date.now()}`;
    verifiedPayments.set(paymentProof, {
      transactionHash,
      treasureId,
      walletAddress,
      verifiedAt: new Date().toISOString(),
      amount: PAYMENT_AMOUNT,
      currency: 'STT',
      blockchainVerified: true
    });
    
    console.log('✅ Payment verification successful:', paymentProof);
    
    res.json({
      success: true,
      paymentProof,
      message: 'Payment verified successfully',
      accessToken: paymentProof,
      verificationDetails: {
        transactionHash,
        treasureId,
        amount: PAYMENT_AMOUNT,
        currency: 'STT'
      }
    });
    
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      error: 'Verification Failed',
      message: 'Internal server error during payment verification',
      details: error.message
    });
  }
});

// Settle payment endpoint
app.post('/api/settle', async (req, res) => {
  try {
    const { paymentProof } = req.body;
    
    if (!paymentProof || !verifiedPayments.has(paymentProof)) {
      return res.status(400).json({
        error: 'Invalid Payment Proof',
        message: 'Payment proof not found or invalid'
      });
    }
    
    const paymentData = verifiedPayments.get(paymentProof);
    
    res.json({
      success: true,
      message: 'Payment settled successfully',
      settlement: {
        paymentProof,
        transactionHash: paymentData.transactionHash,
        amount: paymentData.amount,
        currency: paymentData.currency,
        settledAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Payment settlement error:', error);
    res.status(500).json({
      error: 'Settlement Failed',
      message: 'Internal server error during payment settlement'
    });
  }
});

// Get treasure data (protected by X402)
app.get('/api/treasure/:treasureId', x402PaymentRequired, (req, res) => {
  try {
    const { treasureId } = req.params;
    const treasure = treasureDatabase[treasureId];
    
    if (!treasure) {
      return res.status(404).json({
        error: 'Treasure Not Found',
        message: `Treasure with ID ${treasureId} does not exist`
      });
    }
    
    // Return full treasure data after payment verification
    res.json({
      success: true,
      treasure,
      payment: req.paymentData,
      accessedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Treasure access error:', error);
    res.status(500).json({
      error: 'Access Failed',
      message: 'Internal server error while accessing treasure data'
    });
  }
});

// List available treasures (basic info only, no payment required)
app.get('/api/treasures', x402PaymentRequired, (req, res) => {
  try {
    const publicTreasureList = Object.values(treasureDatabase).map(treasure => ({
      id: treasure.id,
      name: treasure.name,
      rarity: treasure.rarity,
      coordinates: treasure.coordinates,
      paymentRequired: true,
      amount: PAYMENT_AMOUNT,
      currency: 'STT'
    }));
    
    res.json({
      success: true,
      treasures: publicTreasureList,
      total: publicTreasureList.length,
      note: 'Full treasure details require payment verification'
    });
    
  } catch (error) {
    console.error('Treasure list error:', error);
    res.status(500).json({
      error: 'List Failed',
      message: 'Internal server error while fetching treasure list'
    });
  }
});

// Get purchased treasures for a wallet address
app.get('/api/purchased/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({
        error: 'Missing Parameter',
        message: 'Wallet address is required'
      });
    }

    // Find all verified payments for this wallet
    const purchasedTreasures = [];
    
    for (const [paymentKey, paymentData] of verifiedPayments.entries()) {
      if (paymentData.walletAddress && 
          paymentData.walletAddress.toLowerCase() === walletAddress.toLowerCase() &&
          paymentData.treasureId) {
        
        const treasure = treasureDatabase[paymentData.treasureId];
        if (treasure) {
          purchasedTreasures.push({
            ...treasure,
            purchaseDate: paymentData.verifiedAt || new Date().toISOString(),
            transactionHash: paymentData.transactionHash,
            paymentAmount: PAYMENT_AMOUNT + ' STT'
          });
        }
      }
    }

    console.log(`Found ${purchasedTreasures.length} purchased treasures for wallet ${walletAddress}`);
    
    res.json({
      success: true,
      walletAddress,
      purchasedTreasures,
      totalPurchases: purchasedTreasures.length,
      totalValue: purchasedTreasures.reduce((sum, treasure) => sum + treasure.value, 0)
    });
    
  } catch (error) {
    console.error('Get purchased treasures error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: 'Internal server error while fetching purchased treasures'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'X402 Treasure API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    blockchain: {
      network: 'Somnia Testnet',
      chainId: SOMNIA_CHAIN_ID,
      rpcUrl: SOMNIA_RPC_URL
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'X402 Treasure API Documentation',
    version: '1.0.0',
    description: 'A payment-gated API for accessing treasure data using the X402 protocol',
    baseUrl: `http://localhost:${PORT}`,
    endpoints: {
      'GET /api/treasures': {
        description: 'List all available treasures (basic info only)',
        authentication: 'None required',
        response: 'Array of treasure summaries'
      },
      'GET /api/treasure/:treasureId': {
        description: 'Get detailed treasure information',
        authentication: 'X402 payment required',
        headers: {
          'X402-Payment-Proof': 'Required - Payment verification token'
        },
        response: 'Complete treasure data with hidden attributes'
      },
      'POST /api/verify': {
        description: 'Verify blockchain payment transaction',
        body: {
          transactionHash: 'string - Blockchain transaction hash',
          treasureId: 'string - Target treasure identifier'
        },
        response: 'Payment proof token for API access'
      },
      'POST /api/settle': {
        description: 'Settle verified payment',
        body: {
          paymentProof: 'string - Payment verification token'
        },
        response: 'Settlement confirmation'
      }
    },
    x402Protocol: {
      standard: 'HTTP 402 Payment Required',
      paymentFlow: [
        '1. Client requests treasure data',
        '2. Server responds with 402 and payment details',
        '3. Client makes STT payment on Somnia blockchain',
        '4. Client submits transaction hash to /verify',
        '5. Server verifies payment and returns access token',
        '6. Client retries request with X402-Payment-Proof header',
        '7. Server returns protected treasure data'
      ],
      headers: {
        'X402-Payment-Required': 'Indicates payment is needed',
        'X402-Amount': 'Payment amount required',
        'X402-Currency': 'Payment currency (STT)',
        'X402-Recipient': 'Payment recipient wallet address',
        'X402-Chain-ID': 'Blockchain network ID',
        'X402-Payment-Proof': 'Client payment verification token'
      }
    },
    examples: {
      paymentRequired: {
        request: 'GET /api/treasure/treasure_1',
        response: {
          status: 402,
          headers: {
            'X402-Payment-Required': 'true',
            'X402-Amount': '1',
            'X402-Currency': 'STT'
          },
          body: {
            error: 'Payment Required',
            payment: {
              amount: '1',
              currency: 'STT',
              recipient: SERVER_WALLET
            }
          }
        }
      },
      successfulAccess: {
        request: {
          method: 'GET',
          url: '/api/treasure/treasure_1',
          headers: {
            'X402-Payment-Proof': 'payment_0x123...abc_1234567890'
          }
        },
        response: {
          status: 200,
          body: {
            success: true,
            treasure: {
              id: 'treasure_1',
              name: 'Golden Compass',
              secretMessage: 'Hidden content...',
              hiddenAttributes: '...'
            }
          }
        }
      }
    }
  });
});

// Blockchain transaction verification
async function verifyTransaction(txHash) {
  try {
    console.log('🔍 Verifying transaction:', txHash);
    console.log('🔍 Expected recipient:', SERVER_WALLET);
    console.log('🔍 Expected amount:', PAYMENT_AMOUNT, 'STT');
    
    // Use direct RPC calls to Somnia testnet
    const rpcPayload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionByHash',
      params: [txHash]
    };
    
    // Get transaction details
    const txResponse = await fetch(SOMNIA_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcPayload)
    });
    
    const txResult = await txResponse.json();
    
    if (!txResult.result) {
      console.log('❌ Transaction not found:', txHash);
      return false;
    }
    
    const tx = txResult.result;
    console.log('📄 Transaction found:', {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value
    });
    
    // Get transaction receipt
    const receiptPayload = {
      jsonrpc: '2.0',
      id: 2,
      method: 'eth_getTransactionReceipt',
      params: [txHash]
    };
    
    const receiptResponse = await fetch(SOMNIA_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(receiptPayload)
    });
    
    const receiptResult = await receiptResponse.json();
    
    if (!receiptResult.result) {
      console.log('❌ Transaction receipt not found:', txHash);
      return false;
    }
    
    const receipt = receiptResult.result;
    
    if (receipt.status !== '0x1') {
      console.log('❌ Transaction failed or pending:', txHash, 'status:', receipt.status);
      return false;
    }
    
    console.log('📄 Transaction receipt:', {
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed
    });
    
    // Verify transaction details
    const value = parseInt(tx.value, 16);
    const expectedValue = parseFloat(PAYMENT_AMOUNT) * Math.pow(10, 18); // Convert to wei
    const recipient = tx.to?.toLowerCase();
    const expectedRecipient = SERVER_WALLET?.toLowerCase();
    
    console.log('💰 Payment verification:', {
      actualValue: value,
      expectedValue: expectedValue,
      actualRecipient: recipient,
      expectedRecipient: expectedRecipient
    });
    
    if (value < expectedValue * 0.99) { // Allow 1% tolerance
      console.log('❌ Insufficient payment amount:', value, 'expected:', expectedValue);
      return false;
    }
    
    if (recipient !== expectedRecipient) {
      console.log('❌ Wrong recipient:', recipient, 'expected:', expectedRecipient);
      return false;
    }
    
    console.log('✅ Transaction verified successfully:', txHash);
    return true;
    
  } catch (error) {
    console.error('❌ Transaction verification error:', error);
    return false;
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint Not Found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /api/treasures',
      'GET /api/treasure/:treasureId',
      'POST /api/verify',
      'POST /api/settle',
      'GET /api/health',
      'GET /api/docs'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏴‍☠️ X402 Treasure API Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`💰 Payment Required: ${PAYMENT_AMOUNT} STT per treasure`);
  console.log(`🔗 Blockchain: Somnia Testnet (Chain ID: ${SOMNIA_CHAIN_ID})`);
  console.log(`📍 Server Wallet: ${SERVER_WALLET}`);
});

module.exports = app;