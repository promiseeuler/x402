/**
 * Basic X402 SDK Usage Example
 * Demonstrates how to use the X402 SDK with Somnia testnet
 */

import { X402SDK, NetworkName } from '../src';

async function basicUsageExample() {
  console.log('🚀 X402 SDK Basic Usage Example');
  console.log('================================\n');

  try {
    // Create SDK instance with Somnia testnet
    console.log('1. Creating SDK instance with Somnia testnet...');
    const sdk = await X402SDK.createWithRandomWallet(
      'SOMNIA_TESTNET' as NetworkName,
      {
        spendingLimits: {
          maxPerRequest: '1.0', // Max 1 STT per request
          maxTotal: '10.0',     // Max 10 STT total
          windowSeconds: 3600,  // 1 hour window
          currentSpending: '0.0',
          windowStart: Date.now()
        },
        options: {
          debug: true,
          timeout: 30000
        }
      }
    );

    console.log('✅ SDK created successfully!');
    console.log(`📍 Wallet Address: ${sdk.getWalletAddress()}`);
    console.log(`🌐 Default Network: ${sdk.getConfig().defaultNetwork}\n`);

    // Display network information
    console.log('2. Network Information:');
    const networkConfig = sdk.getNetworkConfig('SOMNIA_TESTNET' as NetworkName);
    console.log(`   Name: ${networkConfig.name}`);
    console.log(`   Chain ID: ${networkConfig.chainId} (0x${networkConfig.chainId.toString(16)})`);
    console.log(`   RPC URL: ${networkConfig.rpcUrl}`);
    console.log(`   Explorer: ${networkConfig.explorerUrl}`);
    console.log(`   Native Token: ${networkConfig.nativeToken.symbol}\n`);

    // Check wallet balance (will likely be 0 for new wallet)
    console.log('3. Checking wallet balance...');
    try {
      const balance = await sdk.getBalance('SOMNIA_TESTNET' as NetworkName);
      console.log(`💰 STT Balance: ${balance}`);
      
      const hasFunds = await sdk.hasSufficientBalance(
        'SOMNIA_TESTNET' as NetworkName,
        '0.1' // Check if we have at least 0.1 STT
      );
      console.log(`💸 Has sufficient funds (0.1 STT): ${hasFunds}\n`);
    } catch (error) {
      console.log(`⚠️  Could not fetch balance: ${error}\n`);
    }

    // Example API request (will fail without actual service)
    console.log('4. Example X402 API Request:');
    console.log('   Note: This will fail without a real X402 service running\n');
    
    try {
      const response = await sdk.get('https://api.example.com/data');
      console.log('✅ API request successful:', response.data);
    } catch (error: any) {
      console.log(`❌ API request failed (expected): ${error.message}\n`);
    }

    // Demonstrate spending tracking
    console.log('5. Spending Management:');
    const currentSpending = sdk.getCurrentSpending('somnia-testnet' as NetworkName, 'STT');
    console.log(`📊 Current spending: ${currentSpending} STT`);
    console.log('💳 Spending limits configured for safety\n');

    // Show supported networks
    console.log('6. Supported Networks:');
    const supportedNetworks = sdk.getSupportedNetworks();
    supportedNetworks.forEach(network => {
      const config = sdk.getNetworkConfig(network);
      console.log(`   • ${config.name} (${network}) - Chain ID: ${config.chainId}`);
    });
    console.log('');

    // Export wallet info (for demo purposes)
    console.log('7. Wallet Information:');
    console.log(`🔑 Private Key: ${sdk.exportPrivateKey()}`);
    console.log('⚠️  Never share your private key in production!\n');

    console.log('🎉 Example completed successfully!');
    console.log('\n📚 Next Steps:');
    console.log('   1. Fund your wallet with STT tokens from Somnia testnet faucet');
    console.log('   2. Find X402-enabled services to interact with');
    console.log('   3. Start making automatic micropayments!');

  } catch (error) {
    console.error('❌ Error in basic usage example:', error);
  }
}

// Run the example
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };