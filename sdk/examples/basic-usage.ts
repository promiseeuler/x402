/**
 * Basic X402 SDK Usage Example
 * 
 * This example demonstrates the fundamental features of the X402 SDK:
 * - Creating and managing wallets
 * - Making payment-enabled requests
 * - Handling 402 Payment Required responses
 * - Setting spending limits
 */

import { createX402SDK, X402Error, X402ErrorCode } from '../src/index.js';

async function basicUsageExample() {
  console.log('🚀 X402 SDK Basic Usage Example\n');

  try {
    // 1. Create SDK instance with default Somnia Testnet configuration
    console.log('1. Creating X402 SDK instance...');
    const sdk = createX402SDK();
    console.log('✅ SDK created successfully\n');

    // 2. Create a new wallet
    console.log('2. Creating a new wallet...');
    const wallet = await sdk.createWallet('my-secure-password-123');
    console.log('✅ Wallet created:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Encrypted: ${wallet.encryptedPrivateKey.substring(0, 50)}...\n`);

    // 3. Set spending limits for safety
    console.log('3. Setting spending limits...');
    sdk.setSpendingLimit('STT', {
      perTransaction: 0.1,  // Max 0.1 STT per transaction
      daily: 1.0           // Max 1 STT per day
    });
    console.log('✅ Spending limits set: 0.1 STT per transaction, 1.0 STT daily\n');

    // 4. Check wallet balance
    console.log('4. Checking wallet balance...');
    const balance = await sdk.getBalance();
    console.log(`✅ Current balance: ${balance} STT\n`);

    // 5. Check remaining spending allowance
    console.log('5. Checking spending allowance...');
    const allowance = sdk.getRemainingAllowance('STT');
    console.log('✅ Spending allowance:');
    console.log(`   Daily remaining: ${allowance.dailyRemaining} STT`);
    console.log(`   Per transaction limit: ${allowance.perTransactionLimit} STT\n`);

    // 6. Make a request to an X402-enabled service
    console.log('6. Making request to X402-enabled service...');
    const testUrl = 'https://api.example-x402-service.com/premium-data';
    
    const result = await sdk.request(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'X402-SDK-Example/1.0'
      },
      autoPayment: true  // Automatically handle payments
    });

    if (result.success) {
      console.log('✅ Request successful:');
      console.log('   Data:', result.data);
    } else if (result.paymentRequired) {
      console.log('💳 Payment required for this service');
      console.log('   Payment options:', result.paymentRequired.accepts.length);
      
      // Handle payment manually if auto-payment failed
      console.log('\n7. Processing payment...');
      const paymentResult = await sdk.handlePayment(
        result.paymentRequired,
        testUrl
      );
      
      if (paymentResult.success) {
        console.log('✅ Payment successful:');
        console.log(`   Transaction: ${paymentResult.paymentPayload?.txHash}`);
        console.log('   Data:', paymentResult.data);
      } else {
        console.log('❌ Payment failed:', paymentResult.error);
      }
    } else {
      console.log('❌ Request failed:', result.error);
    }

    // 8. Demonstrate wallet management
    console.log('\n8. Wallet management demo...');
    
    // Save wallet info for later use
    const walletInfo = {
      address: wallet.address,
      encryptedPrivateKey: wallet.encryptedPrivateKey
    };
    
    // Clear wallet from memory
    sdk.clearWallet();
    console.log('✅ Wallet cleared from memory');
    
    // Reload wallet
    const reloadedAddress = await sdk.loadWallet(
      walletInfo.encryptedPrivateKey,
      'my-secure-password-123'
    );
    console.log(`✅ Wallet reloaded: ${reloadedAddress}`);
    
    // Verify it's the same wallet
    if (reloadedAddress === walletInfo.address) {
      console.log('✅ Wallet verification successful\n');
    } else {
      console.log('❌ Wallet verification failed\n');
    }

    // 9. Get SDK configuration
    console.log('9. SDK Configuration:');
    const config = sdk.getConfig();
    console.log('✅ Current configuration:');
    console.log(`   Network: ${config.network?.name} (Chain ID: ${config.network?.chainId})`);
    console.log(`   Auto-settle: ${config.autoSettle}`);
    console.log(`   Timeout: ${config.timeout}ms`);
    console.log(`   Retry attempts: ${config.retryAttempts}\n`);

    console.log('🎉 Basic usage example completed successfully!');

  } catch (error) {
    console.error('❌ Example failed:');
    
    if (error instanceof X402Error) {
      console.error(`   X402 Error (${error.code}): ${error.message}`);
      
      // Handle specific error types
      switch (error.code) {
        case X402ErrorCode.WALLET_NOT_INITIALIZED:
          console.error('   💡 Tip: Create or load a wallet first');
          break;
        case X402ErrorCode.INSUFFICIENT_BALANCE:
          console.error('   💡 Tip: Add funds to your wallet');
          break;
        case X402ErrorCode.SPENDING_LIMIT_EXCEEDED:
          console.error('   💡 Tip: Increase spending limits or wait for daily reset');
          break;
        case X402ErrorCode.NETWORK_ERROR:
          console.error('   💡 Tip: Check your internet connection and RPC endpoint');
          break;
        default:
          console.error('   💡 Tip: Check the documentation for more details');
      }
    } else {
      console.error('   Error:', error);
    }
  }
}

// Alternative: Quick start for development
async function quickStartExample() {
  console.log('\n🚀 Quick Start Example (Development Only)\n');
  
  try {
    // For development, you can use a private key directly
    // ⚠️ NEVER use this in production!
    const developmentPrivateKey = '0x' + '1'.repeat(64); // Example key
    
    console.log('Creating SDK with development wallet...');
    const { quickStart } = await import('../src/index.js');
    const sdk = quickStart(developmentPrivateKey);
    
    console.log('✅ Development SDK ready');
    console.log(`   Wallet: ${sdk.getWalletAddress()}`);
    
    // Set conservative spending limits for development
    sdk.setSpendingLimit('STT', {
      perTransaction: 0.01,  // Very small amounts for testing
      daily: 0.1
    });
    
    console.log('✅ Development spending limits set');
    console.log('💡 Ready for testing X402 payments!');
    
  } catch (error) {
    console.error('❌ Quick start failed:', error);
  }
}

// Run examples
if (require.main === module) {
  basicUsageExample()
    .then(() => quickStartExample())
    .catch(console.error);
}

export { basicUsageExample, quickStartExample };