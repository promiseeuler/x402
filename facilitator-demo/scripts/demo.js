#!/usr/bin/env node

/**
 * X402 Facilitator Demo Script
 * 
 * This script demonstrates the complete X402 facilitator workflow:
 * 1. Client discovers resources
 * 2. Client attempts to access protected resource
 * 3. Resource server responds with 402 Payment Required
 * 4. Client creates payment payload
 * 5. Client submits payment to facilitator for verification
 * 6. Facilitator verifies and settles payment
 * 7. Client accesses resource with verified payment
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  facilitator: 'http://localhost:3003',
  resourceServer: 'http://localhost:3004',
  client: {
    id: 'demo-client-001',
    wallet: '0x742d35Cc6634C0532925a3b8D0C9e3e7c4FD5d46' // Mock wallet address
  }
};

class X402Demo {
  constructor() {
    this.paymentId = null;
    this.paymentToken = null;
  }

  /**
   * Generate a mock payment payload
   */
  generatePaymentPayload(amount, currency = 'ETH') {
    const paymentId = crypto.randomUUID();
    const timestamp = Date.now();
    
    // Mock transaction hash (in real implementation, this would be from blockchain)
    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    
    return {
      paymentId,
      amount,
      currency,
      from: CONFIG.client.wallet,
      to: '0x1234567890123456789012345678901234567890', // Mock facilitator wallet
      txHash,
      timestamp,
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      gasUsed: '21000',
      gasPrice: '20000000000',
      nonce: Math.floor(Math.random() * 1000),
      signature: '0x' + crypto.randomBytes(65).toString('hex') // Mock signature
    };
  }

  /**
   * Add delay for better demo visualization
   */
  async delay(ms, message = null) {
    if (message) {
      console.log(`⏳ ${message}`);
    }
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if services are running
   */
  async checkServices() {
    console.log('🔍 Checking if services are running...');
    
    try {
      // Check facilitator
      const facilitatorResponse = await axios.get(`${CONFIG.facilitator}/health`, {
        timeout: 5000
      });
      console.log('✅ Facilitator service is running');
      
      // Check resource server
      const resourceResponse = await axios.get(`${CONFIG.resourceServer}/health`, {
        timeout: 5000
      });
      console.log('✅ Resource server is running');
      
      return true;
    } catch (error) {
      console.error('❌ Services are not running. Please start them first:');
      console.error('   node scripts/start-all.js');
      return false;
    }
  }

  /**
   * Step 1: Discover available resources
   */
  async discoverResources() {
    console.log('\n📋 Step 1: Discovering available resources...');
    
    try {
      const response = await axios.get(`${CONFIG.resourceServer}/api/catalog`);
      
      console.log('✅ Available resources:');
      response.data.resources.forEach((resource, index) => {
        console.log(`   ${index + 1}. ${resource.name}`);
        console.log(`      Endpoint: ${resource.endpoint}`);
        console.log(`      Price: ${resource.price} ${resource.currency}`);
        console.log(`      Description: ${resource.description}`);
        console.log('');
      });
      
      return response.data.resources;
    } catch (error) {
      console.error('❌ Failed to discover resources:', error.message);
      throw error;
    }
  }

  /**
   * Step 2: Attempt to access protected resource (expect 402)
   */
  async attemptResourceAccess(endpoint) {
    console.log(`\n🚫 Step 2: Attempting to access protected resource: ${endpoint}`);
    
    try {
      const response = await axios.get(`${CONFIG.resourceServer}${endpoint}`);
      console.log('⚠️  Unexpected: Resource access granted without payment');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 402) {
        console.log('✅ Expected 402 Payment Required response received');
        
        const paymentInfo = error.response.data;
        console.log('💰 Payment required:');
        console.log(`   Amount: ${paymentInfo.amount} ${paymentInfo.currency}`);
        console.log(`   Facilitator: ${paymentInfo.facilitator}`);
        console.log(`   Resource: ${paymentInfo.resource}`);
        
        return paymentInfo;
      } else {
        console.error('❌ Unexpected error:', error.message);
        throw error;
      }
    }
  }

  /**
   * Step 3: Create and submit payment to facilitator
   */
  async submitPayment(paymentInfo) {
    console.log('\n💳 Step 3: Creating and submitting payment...');
    
    // Generate payment payload
    const paymentPayload = this.generatePaymentPayload(
      paymentInfo.amount,
      paymentInfo.currency
    );
    
    this.paymentId = paymentPayload.paymentId;
    
    console.log('📝 Payment payload created:');
    console.log(`   Payment ID: ${paymentPayload.paymentId}`);
    console.log(`   Amount: ${paymentPayload.amount} ${paymentPayload.currency}`);
    console.log(`   Transaction Hash: ${paymentPayload.txHash}`);
    console.log(`   From: ${paymentPayload.from}`);
    console.log(`   To: ${paymentPayload.to}`);
    
    await this.delay(1000, 'Submitting payment to facilitator...');
    
    try {
      // Submit to facilitator for verification
      const response = await axios.post(`${CONFIG.facilitator}/verify`, {
        payment: paymentPayload,
        resource: paymentInfo.resource,
        clientId: CONFIG.client.id
      });
      
      console.log('✅ Payment verification response:');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Payment Token: ${response.data.paymentToken}`);
      console.log(`   Valid Until: ${new Date(response.data.validUntil).toLocaleString()}`);
      
      this.paymentToken = response.data.paymentToken;
      
      return response.data;
    } catch (error) {
      console.error('❌ Payment verification failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Step 4: Access resource with verified payment
   */
  async accessResourceWithPayment(endpoint) {
    console.log('\n🔓 Step 4: Accessing resource with verified payment...');
    
    if (!this.paymentToken) {
      throw new Error('No payment token available');
    }
    
    try {
      const response = await axios.get(`${CONFIG.resourceServer}${endpoint}`, {
        headers: {
          'X-Payment-Token': this.paymentToken
        }
      });
      
      console.log('✅ Resource access granted!');
      console.log('📄 Resource data:');
      console.log(JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to access resource:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Step 5: Demonstrate payment settlement
   */
  async settlePayment() {
    console.log('\n💰 Step 5: Settling payment...');
    
    if (!this.paymentId) {
      throw new Error('No payment ID available');
    }
    
    await this.delay(1000, 'Processing settlement...');
    
    try {
      const response = await axios.post(`${CONFIG.facilitator}/settle`, {
        paymentId: this.paymentId,
        action: 'settle'
      });
      
      console.log('✅ Payment settlement response:');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Settlement ID: ${response.data.settlementId}`);
      console.log(`   Settled At: ${new Date(response.data.settledAt).toLocaleString()}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Payment settlement failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Run the complete demo
   */
  async runDemo() {
    console.log('🎯 X402 Facilitator Demo');
    console.log('=' .repeat(50));
    console.log('This demo showcases the complete X402 payment workflow');
    console.log('with a facilitator managing payment verification and settlement.\n');
    
    try {
      // Check services
      const servicesRunning = await this.checkServices();
      if (!servicesRunning) {
        return;
      }
      
      await this.delay(1000);
      
      // Step 1: Discover resources
      const resources = await this.discoverResources();
      
      await this.delay(2000);
      
      // Step 2: Try to access first premium resource
      const premiumResource = resources.find(r => r.name.includes('Premium'));
      if (!premiumResource) {
        throw new Error('No premium resource found for demo');
      }
      
      const paymentInfo = await this.attemptResourceAccess(premiumResource.endpoint);
      
      await this.delay(2000);
      
      // Step 3: Submit payment
      const verificationResult = await this.submitPayment(paymentInfo);
      
      await this.delay(2000);
      
      // Step 4: Access resource with payment
      const resourceData = await this.accessResourceWithPayment(premiumResource.endpoint);
      
      await this.delay(2000);
      
      // Step 5: Settle payment
      const settlementResult = await this.settlePayment();
      
      console.log('\n🎉 Demo completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   ✅ Resource discovered: ${premiumResource.name}`);
      console.log(`   ✅ Payment verified: ${verificationResult.paymentToken.substring(0, 20)}...`);
      console.log(`   ✅ Resource accessed: ${Object.keys(resourceData).length} data fields`);
      console.log(`   ✅ Payment settled: ${settlementResult.settlementId}`);
      
      console.log('\n🔗 Next steps:');
      console.log('   • Explore the API documentation in ./docs/');
      console.log('   • Modify the client example in ./client-example/');
      console.log('   • Customize the facilitator logic in ./facilitator-server/');
      console.log('   • Add new resources in ./resource-server/');
      
    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      console.error('\n🔧 Troubleshooting:');
      console.error('   • Ensure all services are running: node scripts/start-all.js');
      console.error('   • Check service logs for errors');
      console.error('   • Verify network connectivity');
      process.exit(1);
    }
  }

  /**
   * Run interactive demo with user choices
   */
  async runInteractiveDemo() {
    console.log('🎮 Interactive X402 Facilitator Demo');
    console.log('=' .repeat(50));
    
    // Check services first
    const servicesRunning = await this.checkServices();
    if (!servicesRunning) {
      return;
    }
    
    // Discover resources
    const resources = await this.discoverResources();
    
    console.log('\n🎯 Choose a resource to access:');
    resources.forEach((resource, index) => {
      console.log(`   ${index + 1}. ${resource.name} (${resource.price} ${resource.currency})`);
    });
    
    // For demo purposes, automatically select the first premium resource
    const premiumResource = resources.find(r => r.name.includes('Premium')) || resources[0];
    console.log(`\n🎯 Auto-selecting: ${premiumResource.name}`);
    
    await this.delay(1000);
    
    // Run the workflow for selected resource
    const paymentInfo = await this.attemptResourceAccess(premiumResource.endpoint);
    await this.delay(1000);
    
    const verificationResult = await this.submitPayment(paymentInfo);
    await this.delay(1000);
    
    const resourceData = await this.accessResourceWithPayment(premiumResource.endpoint);
    await this.delay(1000);
    
    const settlementResult = await this.settlePayment();
    
    console.log('\n🎉 Interactive demo completed!');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const demo = new X402Demo();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('X402 Facilitator Demo Script');
    console.log('');
    console.log('Usage: node demo.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --interactive, -i    Run interactive demo with choices');
    console.log('  --help, -h           Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node demo.js                # Run automated demo');
    console.log('  node demo.js --interactive  # Run interactive demo');
    process.exit(0);
  }
  
  if (args.includes('--interactive') || args.includes('-i')) {
    demo.runInteractiveDemo();
  } else {
    demo.runDemo();
  }
}

module.exports = X402Demo;