/**
 * X402 Facilitator Server
 * 
 * This server implements the facilitator role in the x402 protocol.
 * It provides /verify and /settle endpoints to help resource servers
 * validate and execute payments without direct blockchain interaction.
 * 
 * Reference: https://x402.gitbook.io/x402/core-concepts/facilitator
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.FACILITATOR_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Mock blockchain verification (in production, this would connect to actual blockchain)
const mockBlockchainVerification = {
  /**
   * Simulates blockchain transaction verification
   * @param {Object} paymentPayload - The payment payload to verify
   * @returns {Object} Verification result
   */
  verifyTransaction: (paymentPayload) => {
    // Mock verification logic
    const { scheme, networkId, amount, token, recipient } = paymentPayload;
    
    // Basic validation
    if (!scheme || !networkId || !amount || !token || !recipient) {
      return {
        valid: false,
        error: 'Missing required payment fields'
      };
    }
    
    // Simulate transaction hash verification
    if (paymentPayload.transactionHash && paymentPayload.transactionHash.length === 66) {
      return {
        valid: true,
        transactionHash: paymentPayload.transactionHash,
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        confirmations: 12
      };
    }
    
    return {
      valid: false,
      error: 'Invalid transaction hash format'
    };
  },
  
  /**
   * Simulates blockchain transaction settlement
   * @param {Object} paymentPayload - The payment payload to settle
   * @returns {Object} Settlement result
   */
  settleTransaction: async (paymentPayload) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock transaction hash
    const transactionHash = '0x' + crypto.randomBytes(32).toString('hex');
    
    return {
      success: true,
      transactionHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      gasUsed: '21000',
      status: 'confirmed'
    };
  }
};

/**
 * POST /verify
 * 
 * Verifies a payment payload against payment details.
 * This endpoint is called by resource servers to validate
 * that a client's payment meets the required criteria.
 */
app.post('/verify', async (req, res) => {
  try {
    const { paymentPayload, paymentDetails } = req.body;
    
    console.log('🔍 Verification request received:', {
      scheme: paymentPayload?.scheme,
      amount: paymentPayload?.amount,
      token: paymentPayload?.token
    });
    
    // Validate request structure
    if (!paymentPayload || !paymentDetails) {
      return res.status(400).json({
        valid: false,
        error: 'Missing paymentPayload or paymentDetails'
      });
    }
    
    // Verify payment amount matches requirements
    if (paymentPayload.amount !== paymentDetails.amount) {
      return res.status(400).json({
        valid: false,
        error: `Amount mismatch. Expected: ${paymentDetails.amount}, Received: ${paymentPayload.amount}`
      });
    }
    
    // Verify token matches requirements
    if (paymentPayload.token !== paymentDetails.token) {
      return res.status(400).json({
        valid: false,
        error: `Token mismatch. Expected: ${paymentDetails.token}, Received: ${paymentPayload.token}`
      });
    }
    
    // Verify recipient matches requirements
    if (paymentPayload.recipient !== paymentDetails.recipient) {
      return res.status(400).json({
        valid: false,
        error: `Recipient mismatch. Expected: ${paymentDetails.recipient}, Received: ${paymentPayload.recipient}`
      });
    }
    
    // Perform blockchain verification
    const verificationResult = mockBlockchainVerification.verifyTransaction(paymentPayload);
    
    if (verificationResult.valid) {
      console.log('✅ Payment verification successful');
      res.json({
        valid: true,
        transactionHash: verificationResult.transactionHash,
        blockNumber: verificationResult.blockNumber,
        confirmations: verificationResult.confirmations,
        verifiedAt: new Date().toISOString()
      });
    } else {
      console.log('❌ Payment verification failed:', verificationResult.error);
      res.status(400).json({
        valid: false,
        error: verificationResult.error
      });
    }
    
  } catch (error) {
    console.error('Error during verification:', error);
    res.status(500).json({
      valid: false,
      error: 'Internal server error during verification'
    });
  }
});

/**
 * POST /settle
 * 
 * Settles a verified payment on the blockchain.
 * This endpoint submits the transaction to the blockchain
 * and waits for confirmation before responding.
 */
app.post('/settle', async (req, res) => {
  try {
    const { paymentPayload, paymentDetails } = req.body;
    
    console.log('💰 Settlement request received:', {
      scheme: paymentPayload?.scheme,
      amount: paymentPayload?.amount,
      recipient: paymentPayload?.recipient
    });
    
    // Validate request structure
    if (!paymentPayload || !paymentDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing paymentPayload or paymentDetails'
      });
    }
    
    // Re-verify before settlement (security best practice)
    const verificationResult = mockBlockchainVerification.verifyTransaction(paymentPayload);
    if (!verificationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed during settlement'
      });
    }
    
    // Perform blockchain settlement
    const settlementResult = await mockBlockchainVerification.settleTransaction(paymentPayload);
    
    if (settlementResult.success) {
      console.log('✅ Payment settlement successful:', settlementResult.transactionHash);
      res.json({
        success: true,
        transactionHash: settlementResult.transactionHash,
        blockNumber: settlementResult.blockNumber,
        gasUsed: settlementResult.gasUsed,
        status: settlementResult.status,
        settledAt: new Date().toISOString()
      });
    } else {
      console.log('❌ Payment settlement failed');
      res.status(500).json({
        success: false,
        error: 'Settlement failed on blockchain'
      });
    }
    
  } catch (error) {
    console.error('Error during settlement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during settlement'
    });
  }
});

/**
 * GET /health
 * 
 * Health check endpoint for the facilitator service
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'x402-facilitator',
    timestamp: new Date().toISOString(),
    endpoints: ['/verify', '/settle']
  });
});

/**
 * GET /
 * 
 * Root endpoint with facilitator information
 */
app.get('/', (req, res) => {
  res.json({
    service: 'X402 Facilitator Server',
    description: 'Provides payment verification and settlement services for x402 protocol',
    version: '1.0.0',
    endpoints: {
      '/verify': 'POST - Verify payment payloads',
      '/settle': 'POST - Settle payments on blockchain',
      '/health': 'GET - Health check'
    },
    documentation: 'https://x402.gitbook.io/x402/core-concepts/facilitator'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 X402 Facilitator Server running on port ${PORT}`);
  console.log(`📚 Documentation: https://x402.gitbook.io/x402/core-concepts/facilitator`);
  console.log(`🔍 Verify endpoint: http://localhost:${PORT}/verify`);
  console.log(`💰 Settle endpoint: http://localhost:${PORT}/settle`);
});

module.exports = app;