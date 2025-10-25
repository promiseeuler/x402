import { X402SDK } from '../src/index';
import { ethers } from 'ethers';
import { ProductionWalletManager } from './production-wallet-setup';

/**
 * Production Scenario Demo
 * 
 * This demonstrates a complete production scenario where the X402 SDK
 * is used to access various paid services and APIs automatically.
 */

interface ServiceConfig {
  name: string;
  baseUrl: string;
  endpoint: string;
  pricePerRequest: string; // in ETH
  merchantAddress: string;
  description: string;
}

interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  gasUsed?: bigint;
  error?: string;
  timestamp: number;
  amount: bigint;
  service: string;
}

class ProductionScenarioRunner {
  private sdk: X402SDK;
  private paymentHistory: PaymentResult[] = [];
  
  // Simulated production services
  private services: ServiceConfig[] = [
    {
      name: 'Premium Weather API',
      baseUrl: 'https://api.weather-premium.com',
      endpoint: 'https://api.weather-premium.com/v1/current',
      pricePerRequest: '0.001', // 0.001 STT per request
      merchantAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
      description: 'High-accuracy weather data with 15-minute updates'
    },
    {
      name: 'AI Content Generator',
      baseUrl: 'https://api.ai-content.com',
      endpoint: 'https://api.ai-content.com/v1/generate',
      pricePerRequest: '0.005', // 0.005 STT per generation
      merchantAddress: '0x8ba1f109551bD432803012645Hac136c30C6A043',
      description: 'GPT-powered content generation service'
    },
    {
      name: 'Real-time Market Data',
      baseUrl: 'https://api.market-data.com',
      endpoint: 'https://api.market-data.com/v1/quotes',
      pricePerRequest: '0.002', // 0.002 STT per quote
      merchantAddress: '0x1234567890123456789012345678901234567890',
      description: 'Live cryptocurrency and stock market data'
    },
    {
      name: 'Premium CDN Access',
      baseUrl: 'https://cdn.premium-content.com',
      endpoint: 'https://cdn.premium-content.com/v1/files',
      pricePerRequest: '0.0005', // 0.0005 STT per file
      merchantAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      description: 'High-speed content delivery network'
    }
  ];

  constructor(sdk: X402SDK) {
    this.sdk = sdk;
  }

  /**
   * Simulate accessing a paid API service
   */
  async accessPaidService(serviceIndex: number, requestData?: any): Promise<PaymentResult> {
    const service = this.services[serviceIndex];
    if (!service) {
      throw new Error(`Service at index ${serviceIndex} not found`);
    }

    console.log(`\n🌐 Accessing: ${service.name}`);
    console.log(`📍 URL: ${service.baseUrl}`);
    console.log(`💰 Price: ${service.pricePerRequest} STT`);
    console.log(`📝 Description: ${service.description}`);

    const amount = ethers.parseEther(service.pricePerRequest);
    const timestamp = Date.now();

    try {
      // Check if we have sufficient balance
      const balance = await this.sdk.getBalance('SOMNIA_TESTNET');
      const balanceEth = parseFloat(balance);
      const amountEth = parseFloat(service.pricePerRequest);
      if (balanceEth < amountEth) {
        throw new Error(`Insufficient balance. Need ${service.pricePerRequest} STT, have ${balance} STT`);
      }

      // Check spending limits
      // const currentSpending = this.sdk.getCurrentSpending('SOMNIA_TESTNET', 'STT');
      const maxPerRequestEth = 2.0; // Default max per request in ETH
      if (amountEth > maxPerRequestEth) {
        throw new Error(`Request amount exceeds per-request limit. Amount: ${amountEth} STT, Limit: ${maxPerRequestEth} STT`);
      }

      console.log(`💳 Processing payment...`);
      
      // Make a payment request to the service using X402 protocol
        await this.sdk.request({
          method: 'POST',
          url: service.endpoint,
          data: {
            service: service.name,
            timestamp,
            requestData: requestData || {}
          }
        });

      const result: PaymentResult = {
          success: true,
          transactionHash: 'simulated_tx_hash_' + Date.now(),
          gasUsed: BigInt('21000'),
          timestamp,
          amount,
          service: service.name
        };

      this.paymentHistory.push(result);
      
      console.log(`✅ Payment successful!`);
      console.log(`🧾 Transaction: ${result.transactionHash}`);
      console.log(`⛽ Gas Used: ${result.gasUsed}`);
      
      // Simulate API response
      await this.simulateServiceResponse(service, requestData);
      
      return result;
      
    } catch (error) {
      const result: PaymentResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp,
        amount,
        service: service.name
      };
      
      this.paymentHistory.push(result);
      console.error(`❌ Payment failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return result;
    }
  }

  /**
   * Simulate service responses for different types of APIs
   */
  private async simulateServiceResponse(service: ServiceConfig, _requestData?: any): Promise<void> {
    console.log(`📡 Receiving response from ${service.name}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    switch (service.name) {
      case 'Premium Weather API':
        console.log(`🌤️  Weather Data: 22°C, Partly Cloudy, 65% Humidity`);
        console.log(`📊 Forecast: Rain expected in 3 hours`);
        break;
        
      case 'AI Content Generator':
        console.log(`🤖 Generated Content: "The future of blockchain technology..."`);
        console.log(`📝 Word Count: 250 words`);
        break;
        
      case 'Real-time Market Data':
        console.log(`📈 BTC/USD: $43,250.00 (+2.5%)`);
        console.log(`📊 ETH/USD: $2,650.00 (+1.8%)`);
        break;
        
      case 'Premium CDN Access':
        console.log(`📁 File delivered: premium-content.mp4`);
        console.log(`⚡ Transfer speed: 50 MB/s`);
        break;
    }
  }

  /**
   * Run a batch of service requests to simulate real usage
   */
  async runBatchRequests(): Promise<void> {
    console.log(`\n🚀 Running batch service requests...`);
    console.log(`📊 Simulating real-world usage patterns`);
    
    const requests = [
      { serviceIndex: 0, data: { location: 'New York', units: 'metric' } },
      { serviceIndex: 2, data: { symbols: ['BTC', 'ETH', 'ADA'] } },
      { serviceIndex: 1, data: { topic: 'blockchain technology', length: 'medium' } },
      { serviceIndex: 3, data: { file: 'premium-video.mp4', quality: '4K' } },
      { serviceIndex: 0, data: { location: 'London', units: 'metric' } },
      { serviceIndex: 2, data: { symbols: ['SOL', 'MATIC', 'AVAX'] } }
    ];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      console.log(`\n📋 Request ${i + 1}/${requests.length}`);
      
      try {
        await this.accessPaidService(request.serviceIndex, request.data);
        
        // Add realistic delay between requests
        if (i < requests.length - 1) {
          const delay = 1000 + Math.random() * 2000; // 1-3 seconds
          console.log(`⏳ Waiting ${Math.round(delay/1000)}s before next request...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ Request ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * Display comprehensive payment analytics
   */
  async displayAnalytics(): Promise<void> {
    console.log(`\n📊 Payment Analytics`);
    console.log(`=`.repeat(50));
    
    const totalPayments = this.paymentHistory.length;
    const successfulPayments = this.paymentHistory.filter(p => p.success).length;
    const failedPayments = totalPayments - successfulPayments;
    
    const totalSpent = this.paymentHistory
      .filter(p => p.success)
      .reduce((sum, p) => sum + p.amount, 0n);
    
    const currentBalance = await this.sdk.getBalance('SOMNIA_TESTNET');
    const currentSpending = this.sdk.getCurrentSpending('SOMNIA_TESTNET', 'STT');
    
    console.log(`📈 Total Requests: ${totalPayments}`);
    console.log(`✅ Successful: ${successfulPayments} (${((successfulPayments/totalPayments)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failedPayments} (${((failedPayments/totalPayments)*100).toFixed(1)}%)`);
    console.log(`💰 Total Spent: ${ethers.formatEther(totalSpent)} STT`);
    console.log(`💎 Current Balance: ${currentBalance} STT`);
    console.log(`📊 Current Spending: ${currentSpending} STT`);
    
    // Service breakdown
    console.log(`\n🏪 Service Usage Breakdown:`);
    const serviceStats = this.services.map(service => {
      const servicePayments = this.paymentHistory.filter(p => p.service === service.name && p.success);
      const serviceSpent = servicePayments.reduce((sum, p) => sum + p.amount, 0n);
      return {
        name: service.name,
        requests: servicePayments.length,
        spent: serviceSpent
      };
    });
    
    serviceStats.forEach(stat => {
      if (stat.requests > 0) {
        console.log(`  📋 ${stat.name}: ${stat.requests} requests, ${ethers.formatEther(stat.spent)} STT`);
      }
    });
    
    // Recent transactions
    console.log(`\n🕒 Recent Transactions:`);
    const recentTransactions = this.paymentHistory.slice(-5).reverse();
    recentTransactions.forEach((tx) => {
      const status = tx.success ? '✅' : '❌';
      const time = new Date(tx.timestamp).toLocaleTimeString();
      console.log(`  ${status} ${time} - ${tx.service} - ${ethers.formatEther(tx.amount)} STT`);
    });
  }

  /**
   * Demonstrate spending limit management
   */
  async demonstrateSpendingLimits(): Promise<void> {
    console.log(`\n🚫 Spending Limit Management Demo`);
    console.log(`=`.repeat(40));
    
    try {
      const currentSpending = this.sdk.getCurrentSpending('SOMNIA_TESTNET', 'STT');
      
      console.log(`💸 Current Spending: ${currentSpending} STT`);
      
      // Update spending limits using the SDK's updateSpendingLimits method
      const newLimits = {
        maxPerRequest: '2.0',
        maxTotal: '20.0',
        windowSeconds: 3600,
        currentSpending: '0.0',
        windowStart: Date.now()
      };
      
      console.log(`\n🔄 Updating spending limits...`);
      
      try {
        this.sdk.updateSpendingLimits(newLimits);
        console.log(`✅ Spending limits updated successfully!`);
        console.log(`💳 New Limits:`);
        console.log(`   Max per request: ${newLimits.maxPerRequest} STT`);
        console.log(`   Max total: ${newLimits.maxTotal} STT`);
        console.log(`   Window: ${newLimits.windowSeconds} seconds`);
      } catch (error) {
        console.error(`❌ Failed to update spending limits: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      console.error(`❌ Spending limit management failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Main production scenario runner
 */
async function runProductionScenario(): Promise<void> {
  console.log(`🏭 X402 SDK - Production Scenario Demo`);
  console.log(`=`.repeat(50));
  
  try {
    // Initialize wallet manager
    const walletManager = new ProductionWalletManager();
    const password = 'SecurePassword123!';
    
    // Load or create wallet
    let sdk: X402SDK;
    try {
      sdk = await walletManager.loadSecureWallet(password);
      console.log(`📂 Loaded existing production wallet`);
    } catch (error) {
      console.log(`🆕 Creating new production wallet...`);
      await walletManager.createSecureWallet(password);
      sdk = await walletManager.loadSecureWallet(password);
    }
    
    // Check wallet status
    await walletManager.checkWalletStatus();
    
    // Initialize scenario runner
    const scenarioRunner = new ProductionScenarioRunner(sdk);
    
    // Check if wallet has sufficient balance for demo
    const balance = await sdk.getBalance('SOMNIA_TESTNET');
    const minBalanceEth = 0.1; // Need at least 0.1 STT
    const balanceEth = parseFloat(balance);
    
    if (balanceEth < minBalanceEth) {
      console.log(`\n⚠️  Insufficient balance for full demo`);
      console.log(`💰 Current: ${balance} STT`);
      console.log(`💰 Required: ${minBalanceEth} STT`);
      console.log(`🚰 Please fund your wallet at: https://faucet.somnia.network`);
      return;
    }
    
    // Run production scenarios
    console.log(`\n🎬 Starting production scenarios...`);
    
    // Scenario 1: Individual service access
    console.log(`\n📋 Scenario 1: Individual Service Access`);
    await scenarioRunner.accessPaidService(0, { location: 'San Francisco', units: 'imperial' });
    
    // Scenario 2: Batch requests
    console.log(`\n📋 Scenario 2: Batch Service Requests`);
    await scenarioRunner.runBatchRequests();
    
    // Scenario 3: Spending limit management
    await scenarioRunner.demonstrateSpendingLimits();
    
    // Display final analytics
    await scenarioRunner.displayAnalytics();
    
    console.log(`\n🎉 Production scenario completed successfully!`);
    console.log(`\n💡 Key Takeaways:`);
    console.log(`   • Automatic micropayments for API access`);
    console.log(`   • Built-in spending limits for safety`);
    console.log(`   • Comprehensive transaction tracking`);
    console.log(`   • Production-ready error handling`);
    console.log(`   • Multi-service payment orchestration`);
    
  } catch (error) {
    console.error(`❌ Production scenario failed:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the scenario if this file is executed directly
if (require.main === module) {
  runProductionScenario().catch(console.error);
}

export { ProductionScenarioRunner, runProductionScenario };