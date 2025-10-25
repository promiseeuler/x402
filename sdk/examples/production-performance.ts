import { X402SDK } from '../src/index';
import { ethers } from 'ethers';
import { ProductionWalletManager } from './production-wallet-setup';
import { ProductionMonitor } from './production-monitoring';
import { ProductionErrorHandler } from './production-error-handling';

/**
 * Production Performance Testing
 * 
 * This demonstrates performance testing, load testing, and concurrent
 * transaction handling for production X402 SDK deployments.
 */

interface PerformanceTestConfig {
  concurrentTransactions: number;
  totalTransactions: number;
  transactionAmount: string; // in ETH
  delayBetweenBatches: number; // milliseconds
  timeoutPerTransaction: number; // milliseconds
}

interface PerformanceResult {
  testName: string;
  config: PerformanceTestConfig;
  startTime: number;
  endTime: number;
  duration: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  averageTransactionTime: number;
  transactionsPerSecond: number;
  totalGasUsed: bigint;
  averageGasUsed: number;
  errors: Array<{ error: string; count: number }>;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
  };
}

interface TransactionResult {
  id: string;
  success: boolean;
  startTime: number;
  endTime: number;
  duration: number;
  transactionHash?: string;
  gasUsed?: bigint;
  error?: string;
}

class PerformanceTester {
  private sdk: X402SDK;
  private monitor: ProductionMonitor;
  private errorHandler: ProductionErrorHandler;
  private results: PerformanceResult[] = [];

  constructor(sdk: X402SDK) {
    this.sdk = sdk;
    this.monitor = new ProductionMonitor(sdk);
    this.errorHandler = new ProductionErrorHandler(sdk);
  }

  /**
   * Run comprehensive performance test suite
   */
  async runPerformanceTestSuite(): Promise<PerformanceResult[]> {
    console.log(`🚀 Starting X402 SDK Performance Test Suite`);
    console.log(`=`.repeat(60));
    
    const testConfigs: Array<{ name: string; config: PerformanceTestConfig }> = [
      {
        name: 'Light Load Test',
        config: {
          concurrentTransactions: 2,
          totalTransactions: 10,
          transactionAmount: '0.001',
          delayBetweenBatches: 1000,
          timeoutPerTransaction: 30000
        }
      },
      {
        name: 'Medium Load Test',
        config: {
          concurrentTransactions: 5,
          totalTransactions: 25,
          transactionAmount: '0.0005',
          delayBetweenBatches: 500,
          timeoutPerTransaction: 45000
        }
      },
      {
        name: 'Heavy Load Test',
        config: {
          concurrentTransactions: 10,
          totalTransactions: 50,
          transactionAmount: '0.0002',
          delayBetweenBatches: 200,
          timeoutPerTransaction: 60000
        }
      },
      {
        name: 'Burst Test',
        config: {
          concurrentTransactions: 20,
          totalTransactions: 20,
          transactionAmount: '0.0001',
          delayBetweenBatches: 0,
          timeoutPerTransaction: 90000
        }
      }
    ];

    for (const test of testConfigs) {
      console.log(`\n🧪 Running ${test.name}...`);
      
      try {
        // Check if we have sufficient balance for this test
        const requiredBalance = ethers.parseEther(
          (parseFloat(test.config.transactionAmount) * test.config.totalTransactions).toString()
        );
        
        const currentBalance = await this.sdk.getBalance('SOMNIA_TESTNET');
        const currentBalanceBigInt = ethers.parseEther(currentBalance);
        if (currentBalanceBigInt < requiredBalance) {
          console.log(`⚠️  Skipping ${test.name} - insufficient balance`);
          console.log(`   Required: ${ethers.formatEther(requiredBalance)} STT`);
          console.log(`   Available: ${ethers.formatEther(currentBalance)} STT`);
          continue;
        }
        
        const result = await this.runLoadTest(test.name, test.config);
        this.results.push(result);
        
        // Display immediate results
        this.displayTestResult(result);
        
        // Cool-down period between tests
        if (testConfigs.indexOf(test) < testConfigs.length - 1) {
          console.log(`\n⏳ Cool-down period (10 seconds)...`);
          await this.sleep(10000);
        }
        
      } catch (error) {
        console.error(`❌ ${test.name} failed: ${error.message}`);
      }
    }
    
    return this.results;
  }

  /**
   * Run a single load test with specified configuration
   */
  async runLoadTest(testName: string, config: PerformanceTestConfig): Promise<PerformanceResult> {
    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    let peakMemory = initialMemory;
    const startTime = Date.now();
    
    console.log(`\n📊 Test Configuration:`);
    console.log(`   Concurrent Transactions: ${config.concurrentTransactions}`);
    console.log(`   Total Transactions: ${config.totalTransactions}`);
    console.log(`   Transaction Amount: ${config.transactionAmount} STT`);
    console.log(`   Delay Between Batches: ${config.delayBetweenBatches}ms`);
    console.log(`   Timeout Per Transaction: ${config.timeoutPerTransaction}ms`);
    
    const transactionResults: TransactionResult[] = [];
    const errors: Map<string, number> = new Map();
    
    // Calculate number of batches
    const batchCount = Math.ceil(config.totalTransactions / config.concurrentTransactions);
    
    for (let batch = 0; batch < batchCount; batch++) {
      const batchStartIndex = batch * config.concurrentTransactions;
      const batchEndIndex = Math.min(batchStartIndex + config.concurrentTransactions, config.totalTransactions);
      const batchSize = batchEndIndex - batchStartIndex;
      
      console.log(`\n🔄 Batch ${batch + 1}/${batchCount} - Processing ${batchSize} transactions...`);
      
      // Create batch of concurrent transactions
      const batchPromises = [];
      for (let i = batchStartIndex; i < batchEndIndex; i++) {
        const transactionId = `tx_${testName}_${i}`;
        const promise = this.executeTransaction(transactionId, config);
        batchPromises.push(promise);
      }
      
      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          transactionResults.push(result.value);
        } else {
          const errorResult: TransactionResult = {
            id: `tx_${testName}_${batchStartIndex + index}`,
            success: false,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            error: result.reason.message
          };
          transactionResults.push(errorResult);
        }
      });
      
      // Update peak memory usage
      const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      peakMemory = Math.max(peakMemory, currentMemory);
      
      // Progress update
      const completed = transactionResults.length;
      const successCount = transactionResults.filter(r => r.success).length;
      console.log(`   Progress: ${completed}/${config.totalTransactions} (${successCount} successful)`);
      
      // Delay between batches
      if (batch < batchCount - 1 && config.delayBetweenBatches > 0) {
        await this.sleep(config.delayBetweenBatches);
      }
    }
    
    const endTime = Date.now();
    const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    // Calculate metrics
    const successfulTransactions = transactionResults.filter(r => r.success);
    const failedTransactions = transactionResults.filter(r => !r.success);
    
    // Count errors
    failedTransactions.forEach(tx => {
      if (tx.error) {
        const count = errors.get(tx.error) || 0;
        errors.set(tx.error, count + 1);
      }
    });
    
    const totalDuration = endTime - startTime;
    const averageTransactionTime = successfulTransactions.length > 0 
      ? successfulTransactions.reduce((sum, tx) => sum + tx.duration, 0) / successfulTransactions.length 
      : 0;
    
    const transactionsPerSecond = (successfulTransactions.length / totalDuration) * 1000;
    
    const totalGasUsed = successfulTransactions.reduce((sum, tx) => sum + (tx.gasUsed || 0n), 0n);
    const averageGasUsed = successfulTransactions.length > 0 
      ? Number(totalGasUsed) / successfulTransactions.length 
      : 0;
    
    return {
      testName,
      config,
      startTime,
      endTime,
      duration: totalDuration,
      totalTransactions: transactionResults.length,
      successfulTransactions: successfulTransactions.length,
      failedTransactions: failedTransactions.length,
      successRate: (successfulTransactions.length / transactionResults.length) * 100,
      averageTransactionTime,
      transactionsPerSecond,
      totalGasUsed,
      averageGasUsed,
      errors: Array.from(errors.entries()).map(([error, count]) => ({ error, count })),
      memoryUsage: {
        initial: initialMemory,
        peak: peakMemory,
        final: finalMemory
      }
    };
  }

  /**
   * Execute a single transaction with monitoring
   */
  private async executeTransaction(transactionId: string, config: PerformanceTestConfig): Promise<TransactionResult> {
    const startTime = Date.now();
    
    try {
      // Create payment data
      const paymentData = {
        amount: ethers.parseEther(config.transactionAmount),
        recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e', // Test recipient
        metadata: {
          transactionId,
          testType: 'performance_test',
          timestamp: startTime
        }
      };
      
      // Execute with timeout
      const result = await Promise.race([
        this.monitor.monitorPayment(paymentData, transactionId),
        this.createTimeoutPromise(config.timeoutPerTransaction)
      ]);
      
      const endTime = Date.now();
      
      return {
        id: transactionId,
        success: true,
        startTime,
        endTime,
        duration: endTime - startTime,
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed
      };
      
    } catch (error) {
      const endTime = Date.now();
      
      return {
        id: transactionId,
        success: false,
        startTime,
        endTime,
        duration: endTime - startTime,
        error: error.message
      };
    }
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Transaction timeout after ${timeout}ms`)), timeout);
    });
  }

  /**
   * Display test result summary
   */
  private displayTestResult(result: PerformanceResult): void {
    console.log(`\n📊 ${result.testName} Results:`);
    console.log(`=`.repeat(40));
    console.log(`⏱️  Duration: ${result.duration}ms`);
    console.log(`📈 Success Rate: ${result.successRate.toFixed(2)}%`);
    console.log(`✅ Successful: ${result.successfulTransactions}/${result.totalTransactions}`);
    console.log(`❌ Failed: ${result.failedTransactions}`);
    console.log(`⚡ Throughput: ${result.transactionsPerSecond.toFixed(2)} TPS`);
    console.log(`⏳ Avg Transaction Time: ${result.averageTransactionTime.toFixed(2)}ms`);
    console.log(`⛽ Total Gas Used: ${result.totalGasUsed.toString()}`);
    console.log(`📊 Avg Gas Used: ${result.averageGasUsed.toFixed(0)}`);
    console.log(`💾 Memory Usage: ${result.memoryUsage.initial.toFixed(2)}MB → ${result.memoryUsage.peak.toFixed(2)}MB → ${result.memoryUsage.final.toFixed(2)}MB`);
    
    if (result.errors.length > 0) {
      console.log(`\n🚨 Error Breakdown:`);
      result.errors.forEach(error => {
        console.log(`   ${error.error}: ${error.count} occurrences`);
      });
    }
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(): any {
    if (this.results.length === 0) {
      return { message: 'No performance test results available' };
    }
    
    const overallStats = {
      totalTests: this.results.length,
      totalTransactions: this.results.reduce((sum, r) => sum + r.totalTransactions, 0),
      totalSuccessful: this.results.reduce((sum, r) => sum + r.successfulTransactions, 0),
      totalFailed: this.results.reduce((sum, r) => sum + r.failedTransactions, 0),
      averageSuccessRate: this.results.reduce((sum, r) => sum + r.successRate, 0) / this.results.length,
      averageThroughput: this.results.reduce((sum, r) => sum + r.transactionsPerSecond, 0) / this.results.length,
      totalGasUsed: this.results.reduce((sum, r) => sum + r.totalGasUsed, 0n),
      totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0)
    };
    
    const bestPerformance = this.results.reduce((best, current) => 
      current.transactionsPerSecond > best.transactionsPerSecond ? current : best
    );
    
    const worstPerformance = this.results.reduce((worst, current) => 
      current.successRate < worst.successRate ? current : worst
    );
    
    return {
      timestamp: Date.now(),
      overallStats,
      bestPerformance: {
        testName: bestPerformance.testName,
        throughput: bestPerformance.transactionsPerSecond,
        successRate: bestPerformance.successRate
      },
      worstPerformance: {
        testName: worstPerformance.testName,
        throughput: worstPerformance.transactionsPerSecond,
        successRate: worstPerformance.successRate
      },
      detailedResults: this.results.map(result => ({
        testName: result.testName,
        duration: result.duration,
        successRate: result.successRate,
        throughput: result.transactionsPerSecond,
        averageTransactionTime: result.averageTransactionTime,
        memoryUsage: result.memoryUsage,
        errorCount: result.failedTransactions
      }))
    };
  }

  /**
   * Run stress test to find system limits
   */
  async runStressTest(): Promise<void> {
    console.log(`\n🔥 Running Stress Test to Find System Limits`);
    console.log(`=`.repeat(50));
    
    const stressConfigs = [
      { concurrent: 5, amount: '0.0001' },
      { concurrent: 10, amount: '0.0001' },
      { concurrent: 15, amount: '0.0001' },
      { concurrent: 20, amount: '0.0001' },
      { concurrent: 25, amount: '0.0001' }
    ];
    
    for (const config of stressConfigs) {
      console.log(`\n🧪 Testing ${config.concurrent} concurrent transactions...`);
      
      try {
        const testConfig: PerformanceTestConfig = {
          concurrentTransactions: config.concurrent,
          totalTransactions: config.concurrent,
          transactionAmount: config.amount,
          delayBetweenBatches: 0,
          timeoutPerTransaction: 120000
        };
        
        const result = await this.runLoadTest(`Stress_${config.concurrent}`, testConfig);
        
        console.log(`📊 Result: ${result.successRate.toFixed(1)}% success rate, ${result.transactionsPerSecond.toFixed(2)} TPS`);
        
        // If success rate drops below 80%, we've likely found the limit
        if (result.successRate < 80) {
          console.log(`🚨 System limit reached at ${config.concurrent} concurrent transactions`);
          break;
        }
        
      } catch (error) {
        console.error(`❌ Stress test failed at ${config.concurrent} concurrent transactions: ${error.message}`);
        break;
      }
      
      // Brief pause between stress tests
      await this.sleep(5000);
    }
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Run comprehensive performance testing
 */
async function runPerformanceTests(): Promise<void> {
  console.log(`🏎️  X402 SDK - Production Performance Testing`);
  console.log(`=`.repeat(60));
  
  try {
    // Initialize wallet
    const walletManager = new ProductionWalletManager();
    const password = 'SecurePassword123!';
    
    let sdk: X402SDK;
    try {
      sdk = await walletManager.loadSecureWallet(password);
    } catch (error) {
      await walletManager.createSecureWallet(password);
      sdk = await walletManager.loadSecureWallet(password);
    }
    
    // Check wallet balance
    const balance = await sdk.getBalance('SOMNIA_TESTNET');
    const balanceBigInt = ethers.parseEther(balance);
    const minBalance = ethers.parseEther('0.5'); // Need at least 0.5 STT for tests
    
    if (balanceBigInt < minBalance) {
      console.log(`\n⚠️  Insufficient balance for performance tests`);
      console.log(`💰 Current: ${balance} STT`);
      console.log(`💰 Required: ${ethers.formatEther(minBalance)} STT`);
      console.log(`🚰 Please fund your wallet at: https://faucet.somnia.network`);
      return;
    }
    
    console.log(`💰 Wallet Balance: ${balance} STT`);
    
    // Initialize performance tester
    const tester = new PerformanceTester(sdk);
    
    // Run performance test suite
    console.log(`\n🚀 Running Performance Test Suite...`);
    const results = await tester.runPerformanceTestSuite();
    
    // Run stress test
    await tester.runStressTest();
    
    // Generate final report
    console.log(`\n📋 Generating Performance Report...`);
    const report = tester.generatePerformanceReport();
    
    console.log(`\n📊 Final Performance Report:`);
    console.log(`=`.repeat(50));
    console.log(JSON.stringify(report, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2
    ));
    
    console.log(`\n🎉 Performance testing completed successfully!`);
    console.log(`\n💡 Key Performance Insights:`);
    console.log(`   • Total Tests Run: ${report.overallStats.totalTests}`);
    console.log(`   • Total Transactions: ${report.overallStats.totalTransactions}`);
    console.log(`   • Overall Success Rate: ${report.overallStats.averageSuccessRate.toFixed(2)}%`);
    console.log(`   • Average Throughput: ${report.overallStats.averageThroughput.toFixed(2)} TPS`);
    console.log(`   • Best Performance: ${report.bestPerformance.testName} (${report.bestPerformance.throughput.toFixed(2)} TPS)`);
    console.log(`   • Total Gas Used: ${report.overallStats.totalGasUsed.toString()}`);
    
  } catch (error) {
    console.error(`❌ Performance testing failed:`, error.message);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

export { PerformanceTester, runPerformanceTests };