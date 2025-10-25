/**
 * Spending Limits and Wallet Management Example
 * 
 * This example demonstrates advanced wallet management features:
 * - Setting and managing spending limits
 * - Transaction tracking and history
 * - Multiple spending limit profiles
 * - Wallet security features
 * - Balance management
 */

import { 
  createX402SDK, 
  createSpendingLimit,
  DEFAULT_SPENDING_LIMITS,
  X402Error,
  X402ErrorCode
} from '../src/index.js';

async function spendingLimitsExample() {
  console.log('💰 Spending Limits and Wallet Management Example\n');

  try {
    // 1. Create SDK and wallet
    console.log('1. Setting up SDK and wallet...');
    const sdk = createX402SDK();
    const wallet = await sdk.createWallet('spending-limits-demo-password');
    console.log('✅ Wallet created:');
    console.log(`   Address: ${wallet.address}`);
    console.log();

    // 2. Demonstrate different spending limit profiles
    console.log('2. Demonstrating spending limit profiles...');
    
    // Conservative profile (default)
    console.log('   📊 Conservative Profile:');
    const conservativeLimit = DEFAULT_SPENDING_LIMITS.Conservative;
    sdk.setSpendingLimit('STT', conservativeLimit);
    console.log(`      Per transaction: ${conservativeLimit.perTransaction} STT`);
    console.log(`      Daily limit: ${conservativeLimit.daily} STT`);
    
    let allowance = sdk.getRemainingAllowance('STT');
    console.log(`      Remaining today: ${allowance.dailyRemaining} STT`);
    console.log();

    // Moderate profile
    console.log('   📈 Moderate Profile:');
    const moderateLimit = DEFAULT_SPENDING_LIMITS.Moderate;
    sdk.setSpendingLimit('STT', moderateLimit);
    console.log(`      Per transaction: ${moderateLimit.perTransaction} STT`);
    console.log(`      Daily limit: ${moderateLimit.daily} STT`);
    
    allowance = sdk.getRemainingAllowance('STT');
    console.log(`      Remaining today: ${allowance.dailyRemaining} STT`);
    console.log();

    // Liberal profile
    console.log('   📊 Liberal Profile:');
    const liberalLimit = DEFAULT_SPENDING_LIMITS.Liberal;
    sdk.setSpendingLimit('STT', liberalLimit);
    console.log(`      Per transaction: ${liberalLimit.perTransaction} STT`);
    console.log(`      Daily limit: ${liberalLimit.daily} STT`);
    
    allowance = sdk.getRemainingAllowance('STT');
    console.log(`      Remaining today: ${allowance.dailyRemaining} STT`);
    console.log();

    // 3. Custom spending limits
    console.log('3. Setting custom spending limits...');
    const customLimit = createSpendingLimit({
      perTransaction: 0.05,  // 0.05 STT per transaction
      daily: 0.5,           // 0.5 STT per day
      weekly: 2.0,          // 2.0 STT per week
      monthly: 5.0          // 5.0 STT per month
    });
    
    sdk.setSpendingLimit('STT', customLimit);
    console.log('✅ Custom spending limits set:');
    console.log(`   Per transaction: ${customLimit.perTransaction} STT`);
    console.log(`   Daily: ${customLimit.daily} STT`);
    console.log(`   Weekly: ${customLimit.weekly} STT`);
    console.log(`   Monthly: ${customLimit.monthly} STT`);
    console.log();

    // 4. Check current balance
    console.log('4. Checking wallet balance...');
    const balance = await sdk.getBalance();
    console.log(`✅ Current balance: ${balance} STT`);
    
    if (parseFloat(balance) === 0) {
      console.log('💡 Tip: Add funds to your wallet to test payments');
      console.log('   You can get test STT from the Somnia faucet:');
      console.log('   https://shannon-explorer.somnia.network/');
    }
    console.log();

    // 5. Simulate spending and track limits
    console.log('5. Simulating spending scenarios...');
    
    // Test small payment within limits
    console.log('   Testing small payment (0.01 STT)...');
    try {
      const smallPaymentResult = await simulatePayment(sdk, 0.01);
      if (smallPaymentResult.success) {
        console.log('   ✅ Small payment would succeed');
      } else {
        console.log('   ❌ Small payment would fail:', smallPaymentResult.error);
      }
    } catch (error) {
      if (error instanceof X402Error && error.code === X402ErrorCode.SPENDING_LIMIT_EXCEEDED) {
        console.log('   ❌ Small payment blocked by spending limits');
      } else {
        console.log('   ❌ Small payment failed:', error.message);
      }
    }
    
    // Test payment exceeding per-transaction limit
    console.log('   Testing large payment (0.1 STT - exceeds limit)...');
    try {
      const largePaymentResult = await simulatePayment(sdk, 0.1);
      if (largePaymentResult.success) {
        console.log('   ✅ Large payment would succeed');
      } else {
        console.log('   ❌ Large payment would fail:', largePaymentResult.error);
      }
    } catch (error) {
      if (error instanceof X402Error && error.code === X402ErrorCode.SPENDING_LIMIT_EXCEEDED) {
        console.log('   ✅ Large payment correctly blocked by spending limits');
      } else {
        console.log('   ❌ Large payment failed:', error.message);
      }
    }
    console.log();

    // 6. Multiple token support
    console.log('6. Setting limits for multiple tokens...');
    
    // Set limits for different tokens
    sdk.setSpendingLimit('ETH', createSpendingLimit({
      perTransaction: 0.001,
      daily: 0.01
    }));
    
    sdk.setSpendingLimit('USDC', createSpendingLimit({
      perTransaction: 10,
      daily: 100
    }));
    
    console.log('✅ Multi-token spending limits set:');
    console.log('   STT: 0.05 per tx, 0.5 daily');
    console.log('   ETH: 0.001 per tx, 0.01 daily');
    console.log('   USDC: 10 per tx, 100 daily');
    
    // Check allowances for all tokens
    ['STT', 'ETH', 'USDC'].forEach(token => {
      const tokenAllowance = sdk.getRemainingAllowance(token);
      console.log(`   ${token} remaining: ${tokenAllowance.dailyRemaining} (daily)`);
    });
    console.log();

    // 7. Wallet security demonstration
    console.log('7. Demonstrating wallet security features...');
    
    // Save wallet info
    const walletInfo = {
      address: wallet.address,
      encryptedPrivateKey: wallet.encryptedPrivateKey
    };
    
    // Clear wallet from memory
    sdk.clearWallet();
    console.log('✅ Wallet cleared from memory for security');
    
    // Try to make payment without wallet (should fail)
    try {
      await simulatePayment(sdk, 0.01);
    } catch (error) {
      if (error instanceof X402Error && error.code === X402ErrorCode.WALLET_NOT_INITIALIZED) {
        console.log('✅ Payment correctly blocked - no wallet loaded');
      }
    }
    
    // Reload wallet
    await sdk.loadWallet(walletInfo.encryptedPrivateKey, 'spending-limits-demo-password');
    console.log('✅ Wallet reloaded successfully');
    console.log();

    // 8. Advanced spending limit scenarios
    console.log('8. Advanced spending limit scenarios...');
    
    // Scenario: API with variable pricing
    console.log('   Scenario: Variable pricing API');
    const apiPrices = [0.01, 0.02, 0.03, 0.04, 0.05]; // Different API call costs
    let totalSpent = 0;
    
    for (let i = 0; i < apiPrices.length; i++) {
      const price = apiPrices[i];
      console.log(`   API call ${i + 1}: ${price} STT`);
      
      try {
        const result = await simulatePayment(sdk, price);
        if (result.success) {
          totalSpent += price;
          console.log(`     ✅ Payment successful (Total spent: ${totalSpent.toFixed(3)} STT)`);
        } else {
          console.log(`     ❌ Payment failed: ${result.error}`);
        }
      } catch (error) {
        if (error instanceof X402Error && error.code === X402ErrorCode.SPENDING_LIMIT_EXCEEDED) {
          console.log(`     ❌ Payment blocked by spending limits`);
          break;
        }
      }
    }
    console.log();

    // 9. Spending limit reset simulation
    console.log('9. Spending limit reset information...');
    const currentAllowance = sdk.getRemainingAllowance('STT');
    console.log('✅ Current spending status:');
    console.log(`   Daily remaining: ${currentAllowance.dailyRemaining} STT`);
    console.log(`   Per transaction limit: ${currentAllowance.perTransactionLimit} STT`);
    
    if (currentAllowance.resetTime) {
      const resetDate = new Date(currentAllowance.resetTime);
      console.log(`   Daily limit resets at: ${resetDate.toLocaleString()}`);
    }
    console.log();

    // 10. Best practices summary
    console.log('10. Spending Limits Best Practices:');
    console.log('✅ Recommendations:');
    console.log('   • Start with conservative limits and increase gradually');
    console.log('   • Set different limits for different token types');
    console.log('   • Monitor spending patterns and adjust limits accordingly');
    console.log('   • Use daily limits to prevent unexpected large expenses');
    console.log('   • Clear wallet from memory when not in use');
    console.log('   • Regularly check remaining allowances');
    console.log('   • Keep encrypted private keys secure');
    console.log();

    console.log('🎉 Spending limits example completed successfully!');

  } catch (error) {
    console.error('❌ Spending limits example failed:', error);
  }
}

// Helper function to simulate payment
async function simulatePayment(sdk: any, amount: number) {
  // Create a mock payment requirement
  const mockRequirement = {
    amount: (amount * 1e18).toString(), // Convert to wei
    token: 'native',
    network: 'somnia',
    scheme: 'exact' as const,
    recipient: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b',
    nonce: Date.now().toString()
  };
  
  // This would normally call sdk.pay(), but for demo purposes
  // we'll just check if the payment would be allowed
  const allowance = sdk.getRemainingAllowance('STT');
  
  if (amount > allowance.perTransactionLimit) {
    throw new X402Error(
      'Payment exceeds per-transaction limit',
      X402ErrorCode.SPENDING_LIMIT_EXCEEDED
    );
  }
  
  if (amount > allowance.dailyRemaining) {
    throw new X402Error(
      'Payment exceeds daily spending limit',
      X402ErrorCode.SPENDING_LIMIT_EXCEEDED
    );
  }
  
  return { success: true, amount };
}

// Example: Emergency spending limit override
async function emergencyOverrideExample() {
  console.log('\n🚨 Emergency Spending Limit Override Example\n');
  
  try {
    const sdk = createX402SDK();
    await sdk.createWallet('emergency-override-password');
    
    // Set very restrictive limits
    sdk.setSpendingLimit('STT', createSpendingLimit({
      perTransaction: 0.001,
      daily: 0.01
    }));
    
    console.log('✅ Restrictive limits set: 0.001 STT per tx, 0.01 STT daily');
    
    // Simulate emergency situation requiring higher payment
    console.log('\n🚨 Emergency: Need to pay 0.1 STT for critical service');
    
    try {
      await simulatePayment(sdk, 0.1);
    } catch (error) {
      console.log('❌ Payment blocked by spending limits');
      
      // Emergency override: temporarily increase limits
      console.log('\n🔓 Applying emergency override...');
      sdk.setSpendingLimit('STT', createSpendingLimit({
        perTransaction: 0.2,  // Temporarily higher
        daily: 0.5
      }));
      
      console.log('✅ Emergency limits applied: 0.2 STT per tx, 0.5 STT daily');
      
      try {
        const result = await simulatePayment(sdk, 0.1);
        console.log('✅ Emergency payment successful');
        
        // Restore original limits after emergency
        console.log('\n🔒 Restoring original limits...');
        sdk.setSpendingLimit('STT', createSpendingLimit({
          perTransaction: 0.001,
          daily: 0.01
        }));
        console.log('✅ Original restrictive limits restored');
        
      } catch (emergencyError) {
        console.log('❌ Emergency payment still failed:', emergencyError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Emergency override example failed:', error);
  }
}

// Run examples
if (require.main === module) {
  spendingLimitsExample()
    .then(() => emergencyOverrideExample())
    .catch(console.error);
}

export { spendingLimitsExample, emergencyOverrideExample };