// Simple test to reproduce the payment error
// Use TypeScript directly to ensure we have the latest code
const { X402Protocol, EmbeddedWalletManager } = require('./src/index.ts');

async function testPayment() {
  try {
    console.log('Creating wallet manager...');
    const walletManager = new EmbeddedWalletManager({
      password: 'test123',
      autoSave: false
    });
    
    // Create a test wallet
    console.log('Creating test wallet...');
    const walletInfo = await walletManager.createSecureWallet('test123');
    console.log('Wallet created:', walletInfo.address);
    
    console.log('Wallet address:', walletManager.getAddress());
    
    // Check balance
    console.log('Checking balance...');
    const balance = await walletManager.getBalance('SOMNIA_TESTNET');
    console.log('Current balance:', balance, 'STT');
    
    // Create X402 protocol instance
    console.log('Creating X402 protocol...');
    const protocol = new X402Protocol({
      walletManager,
      defaultNetwork: 'SOMNIA_TESTNET',
      debug: true
    });
    
    // Test payment with a small amount (this will fail due to insufficient balance)
    console.log('Testing payment...');
    const result = await protocol.makePayment({
      amount: '0.001',
      recipient: '0x20e7B473A2595A7BfA85D83D9151509AECA50b08',
      metadata: { test: true }
    });
    
    console.log('Payment result:', result);
    
    // Test with invalid amount to reproduce the FixedNumber error
    console.log('Testing with scientific notation amount...');
    const scientificResult = await protocol.makePayment({
      amount: '1e-3',  // This might cause the FixedNumber error
      recipient: '0x20e7B473A2595A7BfA85D83D9151509AECA50b08',
      metadata: { test: true }
    });
    
    console.log('Payment result:', result);
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testPayment();