/**
 * X402 Client Demo
 * 
 * This client demonstrates how to interact with x402 payment-gated resources.
 * It shows the complete flow from discovering payment requirements to
 * submitting payments and accessing protected content.
 * 
 * Reference: https://x402.gitbook.io/x402
 */

const axios = require('axios');
const crypto = require('crypto');

class X402Client {
  constructor(resourceServerUrl = 'http://localhost:3004') {
    this.resourceServerUrl = resourceServerUrl;
    this.walletAddress = '0x1234567890123456789012345678901234567890'; // Mock wallet
  }

  /**
   * Creates a mock payment payload for demonstration
   * In a real implementation, this would involve actual blockchain transactions
   */
  createPaymentPayload(paymentDetails) {
    // Generate a mock transaction hash
    const transactionHash = '0x' + crypto.randomBytes(32).toString('hex');
    
    return {
      scheme: paymentDetails.scheme,
      networkId: paymentDetails.networkId,
      amount: paymentDetails.amount,
      token: paymentDetails.token,
      recipient: paymentDetails.recipient,
      sender: this.walletAddress,
      transactionHash: transactionHash,
      nonce: Date.now(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Attempts to access a protected resource
   * Handles the x402 payment flow automatically
   */
  async accessResource(endpoint) {
    try {
      console.log(`\n🔍 Attempting to access: ${endpoint}`);
      
      // First, try to access without payment
      const initialResponse = await axios.get(`${this.resourceServerUrl}${endpoint}`, {
        validateStatus: () => true // Don't throw on 402
      });
      
      if (initialResponse.status === 200) {
        console.log('✅ Resource accessed without payment (public resource)');
        return initialResponse.data;
      }
      
      if (initialResponse.status === 402) {
        console.log('💳 Payment required, processing payment...');
        
        const paymentRequired = initialResponse.data;
        console.log('Payment details:', paymentRequired.accepts[0]);
        
        // Create payment payload
        const paymentDetails = paymentRequired.accepts[0];
        const paymentPayload = this.createPaymentPayload(paymentDetails);
        
        console.log('📝 Created payment payload:', {
          amount: paymentPayload.amount,
          token: paymentPayload.token,
          transactionHash: paymentPayload.transactionHash
        });
        
        // Encode payment payload as base64
        const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
        
        // Retry request with payment
        const paidResponse = await axios.get(`${this.resourceServerUrl}${endpoint}`, {
          headers: {
            'X-Payment': paymentHeader
          },
          validateStatus: () => true
        });
        
        if (paidResponse.status === 200) {
          console.log('✅ Payment successful! Resource accessed.');
          
          // Check for payment response header
          const paymentResponseHeader = paidResponse.headers['x-payment-response'];
          if (paymentResponseHeader) {
            const paymentResponse = JSON.parse(Buffer.from(paymentResponseHeader, 'base64').toString());
            console.log('💰 Payment settled:', {
              transactionHash: paymentResponse.transactionHash,
              blockNumber: paymentResponse.blockNumber,
              status: paymentResponse.status
            });
          }
          
          return paidResponse.data;
        } else {
          console.log('❌ Payment failed:', paidResponse.data);
          throw new Error(`Payment failed: ${paidResponse.data.message}`);
        }
      } else {
        throw new Error(`Unexpected response status: ${initialResponse.status}`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to resource server. Make sure it\'s running.');
      } else {
        console.error('❌ Error accessing resource:', error.message);
      }
      throw error;
    }
  }

  /**
   * Discovers available resources from the server catalog
   */
  async discoverResources() {
    try {
      console.log('\n📋 Discovering available resources...');
      const response = await axios.get(`${this.resourceServerUrl}/api/catalog`);
      
      console.log('Available resources:');
      response.data.available_resources.forEach((resource, index) => {
        console.log(`  ${index + 1}. ${resource.endpoint}`);
        console.log(`     Description: ${resource.description}`);
        console.log(`     Payment: ${resource.payment_required.amount} tokens`);
      });
      
      return response.data.available_resources;
    } catch (error) {
      console.error('❌ Error discovering resources:', error.message);
      throw error;
    }
  }

  /**
   * Demonstrates the complete x402 workflow
   */
  async demonstrateWorkflow() {
    console.log('🚀 Starting X402 Client Demo');
    console.log('=' .repeat(50));
    
    try {
      // Discover available resources
      const resources = await this.discoverResources();
      
      // Try to access each protected resource
      for (const resource of resources) {
        try {
          const data = await this.accessResource(resource.endpoint);
          console.log(`📊 Resource data received:`, {
            endpoint: data.resource,
            description: data.description,
            dataKeys: Object.keys(data.data)
          });
        } catch (error) {
          console.log(`❌ Failed to access ${resource.endpoint}: ${error.message}`);
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
    
    console.log('\n✅ Demo completed!');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const client = new X402Client();
  
  if (args.length === 0) {
    // Run full demonstration
    client.demonstrateWorkflow();
  } else if (args[0] === 'discover') {
    // Discover resources only
    client.discoverResources();
  } else if (args[0] === 'access' && args[1]) {
    // Access specific resource
    client.accessResource(args[1])
      .then(data => {
        console.log('✅ Success!');
        console.log(JSON.stringify(data, null, 2));
      })
      .catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  node client.js                    # Run full demo');
    console.log('  node client.js discover           # Discover resources');
    console.log('  node client.js access <endpoint>  # Access specific resource');
    console.log('');
    console.log('Examples:');
    console.log('  node client.js access /api/premium-data');
    console.log('  node client.js access /api/ai-analysis');
  }
}

module.exports = X402Client;