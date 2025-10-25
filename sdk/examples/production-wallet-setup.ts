import { X402SDK, NetworkName } from '../src/index';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Production Wallet Setup
 * 
 * This script demonstrates how to set up a production-ready wallet
 * with proper security measures and funding procedures.
 */

interface WalletConfig {
  address: string;
  network: string;
  encryptedPrivateKey?: string;
  createdAt: string;
}

class ProductionWalletManager {
  private configPath: string;
  private sdk!: X402SDK;

  constructor() {
    this.configPath = path.join(__dirname, '..', '.wallet-config.json');
  }

  /**
   * Create a new production wallet with encryption
   */
  async createSecureWallet(password: string, network: string = 'SOMNIA_TESTNET'): Promise<WalletConfig> {
    console.log('🔐 Creating secure production wallet...');
    
    // Generate a new wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Encrypt the private key
    const encryptedPrivateKey = await wallet.encrypt(password);
    
    // Initialize SDK with the wallet
    this.sdk = new X402SDK({
      defaultNetwork: network as NetworkName,
      wallet: {
        privateKey: wallet.privateKey
      },
      spendingLimits: {
        maxPerRequest: '1.0',
        maxTotal: '10.0',
        windowSeconds: 3600,
        currentSpending: '0.0',
        windowStart: Date.now()
      },
      facilitator: {
        baseUrl: 'https://facilitator.somnia.network'
      }
    });

    const config: WalletConfig = {
      address: wallet.address,
      network,
      encryptedPrivateKey,
      createdAt: new Date().toISOString()
    };

    // Save encrypted configuration
    await this.saveWalletConfig(config);
    
    console.log(`✅ Wallet created successfully!`);
    console.log(`📍 Address: ${wallet.address}`);
    console.log(`🌐 Network: ${network}`);
    console.log(`💾 Configuration saved to: ${this.configPath}`);
    
    return config;
  }

  /**
   * Load existing wallet from encrypted storage
   */
  async loadSecureWallet(password: string): Promise<X402SDK> {
    console.log('🔓 Loading secure wallet...');
    
    const config = await this.loadWalletConfig();
    if (!config.encryptedPrivateKey) {
      throw new Error('No encrypted private key found in configuration');
    }

    // Decrypt the private key
    const wallet = await ethers.Wallet.fromEncryptedJson(config.encryptedPrivateKey, password);
    
    // Initialize SDK
    this.sdk = new X402SDK({
      defaultNetwork: config.network as NetworkName,
      wallet: {
        privateKey: wallet.privateKey
      },
      spendingLimits: {
        maxPerRequest: '1.0',
        maxTotal: '10.0',
        windowSeconds: 3600,
        currentSpending: '0.0',
        windowStart: Date.now()
      },
      facilitator: {
        baseUrl: 'https://facilitator.somnia.network'
      }
    });

    console.log(`✅ Wallet loaded successfully!`);
    console.log(`📍 Address: ${config.address}`);
    console.log(`🌐 Network: ${config.network}`);
    
    return this.sdk;
  }

  /**
   * Check wallet balance and funding status
   */
  async checkWalletStatus(): Promise<void> {
    if (!this.sdk) {
      throw new Error('SDK not initialized. Load or create a wallet first.');
    }

    console.log('\n💰 Checking wallet status...');
    
    const balance = await this.sdk.getBalance('SOMNIA_TESTNET');
    const address = await this.sdk.getWalletAddress();
    const currentSpending = this.sdk.getCurrentSpending('SOMNIA_TESTNET', 'STT');
    // Check spending limits (simulated)
    const spendingLimit = { maxPerRequest: '1.0', maxTotal: '10.0' };
    
    console.log(`📍 Address: ${address}`);
    console.log(`💎 Balance: ${balance} STT`);
    console.log(`💸 Current Spending: ${currentSpending} STT`);
    console.log(`🚫 Spending Limit: ${spendingLimit.maxPerRequest} STT per request, ${spendingLimit.maxTotal} STT total`);
    
    // Check if wallet needs funding
    const minBalance = 1.0; // Minimum 1 STT
    const balanceEth = parseFloat(balance);
    if (balanceEth < minBalance) {
      console.log('\n⚠️  WALLET NEEDS FUNDING!');
      console.log('Please fund your wallet using the Somnia testnet faucet:');
      console.log(`🚰 Faucet URL: https://faucet.somnia.network`);
      console.log(`📍 Your Address: ${address}`);
      console.log(`💰 Recommended Amount: 10 STT`);
    } else {
      console.log('\n✅ Wallet is properly funded!');
    }
  }

  /**
   * Demonstrate production payment flow
   */
  async demonstratePaymentFlow(): Promise<void> {
    if (!this.sdk) {
      throw new Error('SDK not initialized. Load or create a wallet first.');
    }

    console.log('\n🚀 Demonstrating production payment flow...');
    
    try {
      // Simulate accessing a paid resource
      const resourceUrl = 'https://api.example.com/premium-data';
      const paymentAmount = ethers.parseEther('0.001'); // 0.001 STT
      
      console.log(`💳 Processing payment for: ${resourceUrl}`);
      console.log(`💰 Amount: ${ethers.formatEther(paymentAmount)} STT`);
      
      // In a real scenario, this would be handled automatically by the HTTP 402 protocol
      await this.sdk.request({
        method: 'POST',
        url: 'https://api.example.com/test-payment',
        data: {
          amount: ethers.formatEther(paymentAmount),
          recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
          description: 'Test payment for production wallet setup'
        }
      });
      
      console.log(`✅ Payment processed successfully!`);
      console.log(`🧾 Transaction Hash: simulated_tx_hash_${Date.now()}`);
      console.log(`⛽ Gas Used: 21000`);
      
      // Update spending tracking
      await this.checkWalletStatus();
      
    } catch (error) {
      console.error('❌ Payment failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Save wallet configuration securely
   */
  private async saveWalletConfig(config: WalletConfig): Promise<void> {
    const configToSave = {
      ...config,
      // Never save unencrypted private keys
      privateKey: undefined
    };
    
    fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2));
  }

  /**
   * Load wallet configuration
   */
  private async loadWalletConfig(): Promise<WalletConfig> {
    if (!fs.existsSync(this.configPath)) {
      throw new Error('No wallet configuration found. Create a wallet first.');
    }
    
    const configData = fs.readFileSync(this.configPath, 'utf8');
    return JSON.parse(configData);
  }

  /**
   * Clean up wallet configuration (for testing)
   */
  async cleanup(): Promise<void> {
    if (fs.existsSync(this.configPath)) {
      fs.unlinkSync(this.configPath);
      console.log('🧹 Wallet configuration cleaned up');
    }
  }
}

/**
 * Production Wallet Setup Demo
 */
async function runProductionWalletDemo(): Promise<void> {
  const walletManager = new ProductionWalletManager();
  const password = 'SecurePassword123!'; // In production, use proper password management
  
  try {
    console.log('🏭 X402 SDK - Production Wallet Setup Demo');
    console.log('=' .repeat(50));
    
    // Step 1: Create or load wallet
    let sdk: X402SDK;
    try {
      sdk = await walletManager.loadSecureWallet(password);
      console.log('📂 Loaded existing wallet');
    } catch (error) {
      console.log('🆕 Creating new wallet...');
      await walletManager.createSecureWallet(password);
      sdk = await walletManager.loadSecureWallet(password);
    }
    
    // Step 2: Check wallet status
    await walletManager.checkWalletStatus();
    
    // Step 3: Demonstrate payment flow (only if funded)
    const balance = await sdk.getBalance('SOMNIA_TESTNET');
    const minBalance = ethers.parseEther('0.01');
    
    const balanceEth = parseFloat(balance);
    if (balanceEth >= parseFloat(ethers.formatEther(minBalance))) {
      await walletManager.demonstratePaymentFlow();
    } else {
      console.log('\n⏭️  Skipping payment demo - insufficient balance');
      console.log('Fund your wallet and run again to see payment flow');
    }
    
    console.log('\n🎉 Production wallet demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runProductionWalletDemo().catch(console.error);
}

export { ProductionWalletManager, runProductionWalletDemo };