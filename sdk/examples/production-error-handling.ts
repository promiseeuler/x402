import { X402SDK } from '../src/index';
import { ethers } from 'ethers';
import { ProductionWalletManager } from './production-wallet-setup';

/**
 * Production Error Handling and Retry Mechanisms
 * 
 * This demonstrates robust error handling, retry logic, and fault tolerance
 * for production environments.
 */

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: string[];
}

interface PaymentAttempt {
  attempt: number;
  timestamp: number;
  error?: string;
  success: boolean;
  transactionHash?: string;
  gasUsed?: bigint;
  delay?: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  threshold: number;
  timeout: number; // milliseconds
}

class ProductionErrorHandler {
  private sdk: X402SDK;
  private retryConfig: RetryConfig;
  private circuitBreaker: CircuitBreakerState;
  private paymentAttempts: Map<string, PaymentAttempt[]> = new Map();

  constructor(sdk: X402SDK, retryConfig?: Partial<RetryConfig>) {
    this.sdk = sdk;
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      retryableErrors: [
        'network error',
        'timeout',
        'insufficient gas',
        'nonce too low',
        'replacement transaction underpriced',
        'connection refused',
        'temporary failure'
      ],
      ...retryConfig
    };

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
      threshold: 5, // Open circuit after 5 failures
      timeout: 60000 // 1 minute timeout
    };
  }

  /**
   * Process payment with comprehensive error handling and retry logic
   */
  async processPaymentWithRetry(
    paymentData: {
      amount: bigint;
      recipient: string;
      metadata?: any;
    },
    paymentId?: string
  ): Promise<any> {
    const id = paymentId || `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`\n💳 Processing payment with ID: ${id}`);
    console.log(`💰 Amount: ${ethers.formatEther(paymentData.amount)} STT`);
    console.log(`📍 Recipient: ${paymentData.recipient}`);

    // Check circuit breaker
    if (!this.isCircuitBreakerClosed()) {
      throw new Error(`Circuit breaker is ${this.circuitBreaker.state}. Service temporarily unavailable.`);
    }

    // Initialize attempt tracking
    if (!this.paymentAttempts.has(id)) {
      this.paymentAttempts.set(id, []);
    }
    const attempts = this.paymentAttempts.get(id)!;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      const attemptData: PaymentAttempt = {
        attempt,
        timestamp: Date.now(),
        success: false
      };

      try {
        console.log(`\n🔄 Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
        
        // Pre-flight checks
        await this.performPreflightChecks(paymentData);
        
        // Process the payment
        const result = await this.sdk.processPayment(paymentData);
        
        // Success!
        attemptData.success = true;
        attemptData.transactionHash = result.transactionHash;
        attemptData.gasUsed = result.gasUsed;
        attempts.push(attemptData);
        
        console.log(`✅ Payment successful on attempt ${attempt}`);
        console.log(`🧾 Transaction: ${result.transactionHash}`);
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker();
        
        return result;
        
      } catch (error) {
        attemptData.error = error.message;
        attempts.push(attemptData);
        
        console.error(`❌ Attempt ${attempt} failed: ${error.message}`);
        
        // Record failure for circuit breaker
        this.recordFailure();
        
        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt === this.retryConfig.maxAttempts) {
          console.error(`🚫 Non-retryable error or max attempts reached`);
          throw new Error(`Payment failed after ${attempt} attempts. Last error: ${error.message}`);
        }
        
        // Calculate delay for next attempt
        const delay = this.calculateBackoffDelay(attempt);
        attemptData.delay = delay;
        
        console.log(`⏳ Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Perform pre-flight checks before attempting payment
   */
  private async performPreflightChecks(paymentData: { amount: bigint; recipient: string }): Promise<void> {
    console.log(`🔍 Performing pre-flight checks...`);
    
    // Check wallet balance
    const balance = await this.sdk.getBalance();
    if (balance < paymentData.amount) {
      throw new Error(`Insufficient balance. Need ${ethers.formatEther(paymentData.amount)} STT, have ${ethers.formatEther(balance)} STT`);
    }
    
    // Check spending limits
    const currentSpending = await this.sdk.getCurrentSpending();
    const spendingLimit = await this.sdk.getSpendingLimit();
    if (currentSpending + paymentData.amount > spendingLimit) {
      throw new Error(`Would exceed spending limit. Current: ${ethers.formatEther(currentSpending)} STT, Limit: ${ethers.formatEther(spendingLimit)} STT`);
    }
    
    // Validate recipient address
    if (!ethers.isAddress(paymentData.recipient)) {
      throw new Error(`Invalid recipient address: ${paymentData.recipient}`);
    }
    
    // Check network connectivity
    try {
      await this.sdk.getBalance(); // Simple connectivity test
    } catch (error) {
      throw new Error(`Network connectivity issue: ${error.message}`);
    }
    
    console.log(`✅ Pre-flight checks passed`);
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error.message.toLowerCase();
    return this.retryConfig.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, this.retryConfig.maxDelay);
  }

  /**
   * Circuit breaker implementation
   */
  private isCircuitBreakerClosed(): boolean {
    const now = Date.now();
    
    switch (this.circuitBreaker.state) {
      case 'CLOSED':
        return true;
        
      case 'OPEN':
        if (now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
          this.circuitBreaker.state = 'HALF_OPEN';
          console.log(`🔄 Circuit breaker moving to HALF_OPEN state`);
          return true;
        }
        return false;
        
      case 'HALF_OPEN':
        return true;
        
      default:
        return false;
    }
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'OPEN';
      console.log(`🚨 Circuit breaker OPENED after ${this.circuitBreaker.failures} failures`);
    }
  }

  private resetCircuitBreaker(): void {
    if (this.circuitBreaker.state !== 'CLOSED') {
      console.log(`✅ Circuit breaker CLOSED - service recovered`);
    }
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'CLOSED';
  }

  /**
   * Graceful degradation - attempt alternative payment methods
   */
  async processPaymentWithFallback(
    paymentData: {
      amount: bigint;
      recipient: string;
      metadata?: any;
    }
  ): Promise<any> {
    console.log(`\n🛡️  Processing payment with fallback mechanisms...`);
    
    try {
      // Primary attempt with full retry logic
      return await this.processPaymentWithRetry(paymentData);
      
    } catch (primaryError) {
      console.log(`⚠️  Primary payment method failed: ${primaryError.message}`);
      console.log(`🔄 Attempting fallback strategies...`);
      
      // Fallback 1: Reduce gas price and retry
      try {
        console.log(`💡 Fallback 1: Reducing gas price...`);
        // In a real implementation, you would adjust gas settings
        return await this.processPaymentWithRetry(paymentData, `fallback1_${Date.now()}`);
        
      } catch (fallback1Error) {
        console.log(`❌ Fallback 1 failed: ${fallback1Error.message}`);
        
        // Fallback 2: Split payment into smaller amounts
        try {
          console.log(`💡 Fallback 2: Splitting payment...`);
          return await this.splitPayment(paymentData);
          
        } catch (fallback2Error) {
          console.log(`❌ Fallback 2 failed: ${fallback2Error.message}`);
          
          // Fallback 3: Queue for later processing
          console.log(`💡 Fallback 3: Queuing payment for later...`);
          await this.queuePaymentForLater(paymentData);
          
          throw new Error(`All payment methods failed. Payment queued for retry. Original error: ${primaryError.message}`);
        }
      }
    }
  }

  /**
   * Split large payments into smaller chunks
   */
  private async splitPayment(paymentData: { amount: bigint; recipient: string; metadata?: any }): Promise<any> {
    const maxChunkSize = ethers.parseEther('1'); // 1 STT max per chunk
    
    if (paymentData.amount <= maxChunkSize) {
      throw new Error('Payment amount too small to split further');
    }
    
    const numChunks = Number(paymentData.amount / maxChunkSize) + (paymentData.amount % maxChunkSize > 0n ? 1 : 0);
    console.log(`🔪 Splitting payment into ${numChunks} chunks`);
    
    const results = [];
    let remainingAmount = paymentData.amount;
    
    for (let i = 0; i < numChunks; i++) {
      const chunkAmount = remainingAmount > maxChunkSize ? maxChunkSize : remainingAmount;
      
      console.log(`💰 Processing chunk ${i + 1}/${numChunks}: ${ethers.formatEther(chunkAmount)} STT`);
      
      const chunkPayment = {
        ...paymentData,
        amount: chunkAmount,
        metadata: {
          ...paymentData.metadata,
          chunkIndex: i,
          totalChunks: numChunks,
          originalAmount: ethers.formatEther(paymentData.amount)
        }
      };
      
      const result = await this.processPaymentWithRetry(chunkPayment, `chunk_${i}_${Date.now()}`);
      results.push(result);
      
      remainingAmount -= chunkAmount;
      
      // Small delay between chunks
      if (i < numChunks - 1) {
        await this.sleep(500);
      }
    }
    
    console.log(`✅ Split payment completed successfully`);
    return {
      success: true,
      chunks: results,
      totalAmount: paymentData.amount,
      totalChunks: numChunks
    };
  }

  /**
   * Queue payment for later processing
   */
  private async queuePaymentForLater(paymentData: { amount: bigint; recipient: string; metadata?: any }): Promise<void> {
    const queueItem = {
      ...paymentData,
      queuedAt: Date.now(),
      retryAfter: Date.now() + 300000, // Retry in 5 minutes
      attempts: 0
    };
    
    // In a real implementation, this would be stored in a persistent queue
    console.log(`📥 Payment queued for retry at ${new Date(queueItem.retryAfter).toLocaleTimeString()}`);
    console.log(`💾 Queue item: ${JSON.stringify(queueItem, null, 2)}`);
  }

  /**
   * Get comprehensive error statistics
   */
  getErrorStatistics(): any {
    const allAttempts = Array.from(this.paymentAttempts.values()).flat();
    const totalAttempts = allAttempts.length;
    const successfulAttempts = allAttempts.filter(a => a.success).length;
    const failedAttempts = totalAttempts - successfulAttempts;
    
    const errorTypes = allAttempts
      .filter(a => !a.success && a.error)
      .reduce((acc, attempt) => {
        const errorType = this.categorizeError(attempt.error!);
        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate: totalAttempts > 0 ? (successfulAttempts / totalAttempts * 100).toFixed(2) + '%' : '0%',
      errorTypes,
      circuitBreakerState: this.circuitBreaker.state,
      circuitBreakerFailures: this.circuitBreaker.failures
    };
  }

  /**
   * Categorize errors for analytics
   */
  private categorizeError(error: string): string {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('insufficient')) return 'Insufficient Funds';
    if (errorLower.includes('network') || errorLower.includes('connection')) return 'Network Error';
    if (errorLower.includes('gas')) return 'Gas Error';
    if (errorLower.includes('nonce')) return 'Nonce Error';
    if (errorLower.includes('timeout')) return 'Timeout';
    if (errorLower.includes('limit')) return 'Limit Exceeded';
    
    return 'Other';
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Demonstrate production error handling scenarios
 */
async function demonstrateErrorHandling(): Promise<void> {
  console.log(`🛡️  X402 SDK - Production Error Handling Demo`);
  console.log(`=`.repeat(50));
  
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
    
    // Initialize error handler
    const errorHandler = new ProductionErrorHandler(sdk, {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    });
    
    console.log(`\n🧪 Testing error handling scenarios...`);
    
    // Scenario 1: Successful payment
    console.log(`\n📋 Scenario 1: Normal Payment Processing`);
    try {
      await errorHandler.processPaymentWithRetry({
        amount: ethers.parseEther('0.001'),
        recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
        metadata: { test: 'normal_payment' }
      });
    } catch (error) {
      console.log(`ℹ️  Payment failed (expected if insufficient balance): ${error.message}`);
    }
    
    // Scenario 2: Payment with fallback
    console.log(`\n📋 Scenario 2: Payment with Fallback Mechanisms`);
    try {
      await errorHandler.processPaymentWithFallback({
        amount: ethers.parseEther('0.002'),
        recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
        metadata: { test: 'fallback_payment' }
      });
    } catch (error) {
      console.log(`ℹ️  Payment with fallback failed (expected): ${error.message}`);
    }
    
    // Display error statistics
    console.log(`\n📊 Error Handling Statistics:`);
    const stats = errorHandler.getErrorStatistics();
    console.log(JSON.stringify(stats, null, 2));
    
    console.log(`\n✅ Error handling demonstration completed!`);
    console.log(`\n💡 Key Features Demonstrated:`);
    console.log(`   • Exponential backoff retry logic`);
    console.log(`   • Circuit breaker pattern`);
    console.log(`   • Pre-flight validation checks`);
    console.log(`   • Graceful degradation strategies`);
    console.log(`   • Payment splitting for large amounts`);
    console.log(`   • Comprehensive error categorization`);
    console.log(`   • Queue-based retry mechanisms`);
    
  } catch (error) {
    console.error(`❌ Error handling demo failed:`, error.message);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateErrorHandling().catch(console.error);
}

export { ProductionErrorHandler, demonstrateErrorHandling };