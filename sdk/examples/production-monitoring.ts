import { X402SDK } from '../src/index';
import { ethers } from 'ethers';
import { ProductionWalletManager } from './production-wallet-setup';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Production Monitoring and Logging System
 * 
 * This demonstrates comprehensive monitoring, logging, and analytics
 * for production X402 SDK deployments.
 */

interface LogEntry {
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: string;
  message: string;
  data?: any;
  transactionHash?: string;
  gasUsed?: bigint;
  amount?: bigint;
  address?: string;
}

interface MetricData {
  timestamp: number;
  metric: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

interface TransactionMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalVolume: bigint;
  averageGasUsed: number;
  averageTransactionTime: number;
  successRate: number;
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

class ProductionMonitor {
  private sdk: X402SDK;
  private logs: LogEntry[] = [];
  private metrics: MetricData[] = [];
  private transactionTimes: Map<string, number> = new Map();
  private logFilePath: string;
  private metricsFilePath: string;
  private startTime: number;

  constructor(sdk: X402SDK) {
    this.sdk = sdk;
    this.startTime = Date.now();
    this.logFilePath = path.join(__dirname, '..', 'logs', 'x402-production.log');
    this.metricsFilePath = path.join(__dirname, '..', 'logs', 'x402-metrics.json');
    
    // Ensure logs directory exists
    const logsDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    this.log('INFO', 'SYSTEM', 'Production monitor initialized');
  }

  /**
   * Log an entry with structured data
   */
  log(level: LogEntry['level'], category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    };
    
    this.logs.push(entry);
    
    // Console output with colors
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelColor = this.getLevelColor(level);
    console.log(`${timestamp} [${levelColor}${level}\x1b[0m] ${category}: ${message}`);
    
    if (data) {
      console.log(`  Data:`, JSON.stringify(data, null, 2));
    }
    
    // Write to file
    this.writeLogToFile(entry);
  }

  /**
   * Record a metric data point
   */
  recordMetric(metric: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metricData: MetricData = {
      timestamp: Date.now(),
      metric,
      value,
      unit,
      tags
    };
    
    this.metrics.push(metricData);
    this.log('DEBUG', 'METRICS', `Recorded metric: ${metric} = ${value} ${unit}`, { tags });
  }

  /**
   * Monitor a payment transaction with comprehensive logging
   */
  async monitorPayment(
    paymentData: {
      amount: bigint;
      recipient: string;
      metadata?: any;
    },
    paymentId?: string
  ): Promise<any> {
    const id = paymentId || `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    this.log('INFO', 'PAYMENT', `Starting payment monitoring`, {
      paymentId: id,
      amount: ethers.formatEther(paymentData.amount),
      recipient: paymentData.recipient,
      metadata: paymentData.metadata
    });
    
    this.transactionTimes.set(id, startTime);
    
    try {
      // Pre-transaction monitoring
      await this.logPreTransactionState(id);
      
      // Process payment
      this.log('INFO', 'PAYMENT', `Processing payment ${id}`);
      // Simulate payment processing (SDK doesn't have direct processPayment method)
      const result = await this.sdk.post('https://api.example.com/payment', {
        amount: ethers.formatEther(paymentData.amount),
        recipient: paymentData.recipient,
        metadata: paymentData.metadata
      });
      
      // Post-transaction monitoring
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.log('INFO', 'PAYMENT', `Payment ${id} completed successfully`, {
        transactionHash: 'mock_tx_hash_' + Date.now(),
        gasUsed: '21000',
        duration: `${duration}ms`
      });
      
      // Record metrics
      this.recordMetric('transaction_duration', duration, 'ms', { status: 'success' });
      this.recordMetric('gas_used', 21000, 'gas', { status: 'success' });
      this.recordMetric('transaction_volume', Number(ethers.formatEther(paymentData.amount)), 'STT', { status: 'success' });
      
      await this.logPostTransactionState(id, result);
      
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.log('ERROR', 'PAYMENT', `Payment ${id} failed`, {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
        amount: ethers.formatEther(paymentData.amount),
        recipient: paymentData.recipient
      });
      
      // Record error metrics
      this.recordMetric('transaction_duration', duration, 'ms', { status: 'failed' });
      this.recordMetric('error_count', 1, 'count', { error_type: this.categorizeError(error instanceof Error ? error.message : String(error)) });
      
      throw error;
    } finally {
      this.transactionTimes.delete(id);
    }
  }

  /**
   * Log wallet state before transaction
   */
  private async logPreTransactionState(paymentId: string): Promise<void> {
    try {
      const balance = await this.sdk.getBalance(this.sdk.getConfig().defaultNetwork);
      const currentSpending = this.sdk.getCurrentSpending(this.sdk.getConfig().defaultNetwork, 'STT');
      const spendingLimits = this.sdk.getConfig().spendingLimits;
      const spendingLimit = spendingLimits ? ethers.parseEther(spendingLimits.maxTotal) : ethers.parseEther('10');
      const address = this.sdk.getWalletAddress();
      
      this.log('DEBUG', 'WALLET_STATE', `Pre-transaction state for ${paymentId}`, {
        address,
        balance: ethers.formatEther(balance),
        currentSpending: currentSpending.toString(),
        spendingLimit: ethers.formatEther(spendingLimit),
        remainingLimit: ethers.formatEther(spendingLimit - ethers.parseEther(currentSpending.toString()))
      });
      
      // Record wallet metrics
      this.recordMetric('wallet_balance', Number(ethers.formatEther(balance)), 'STT');
      this.recordMetric('spending_utilization', currentSpending / Number(ethers.formatEther(spendingLimit)) * 100, 'percent');
      
    } catch (error) {
      this.log('WARN', 'WALLET_STATE', `Failed to log pre-transaction state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Log wallet state after transaction
   */
  private async logPostTransactionState(paymentId: string, result: any): Promise<void> {
    try {
      const balance = await this.sdk.getBalance(this.sdk.getConfig().defaultNetwork);
      const currentSpending = this.sdk.getCurrentSpending(this.sdk.getConfig().defaultNetwork, 'STT');
      
      this.log('DEBUG', 'WALLET_STATE', `Post-transaction state for ${paymentId}`, {
        newBalance: ethers.formatEther(balance),
        newSpending: currentSpending.toString(),
        transactionHash: result.transactionHash || 'mock_tx_hash',
        gasUsed: result.gasUsed?.toString() || '21000'
      });
      
      // Update wallet metrics
      this.recordMetric('wallet_balance', Number(ethers.formatEther(balance)), 'STT');
      
    } catch (error) {
      this.log('WARN', 'WALLET_STATE', `Failed to log post-transaction state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Monitor system health and performance
   */
  async monitorSystemHealth(): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    try {
      // Test network connectivity
      await this.sdk.getBalance(this.sdk.getConfig().defaultNetwork);
      const responseTime = Date.now() - startTime;
      
      // Calculate throughput (transactions per minute)
      const uptime = Date.now() - this.startTime;
      const totalTransactions = this.getTransactionMetrics().totalTransactions;
      const throughput = totalTransactions / (uptime / 60000); // per minute
      
      // Calculate error rate
      const errorRate = this.calculateErrorRate();
      
      // Simulate memory and CPU usage (in production, use actual system metrics)
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      const cpuUsage = Math.random() * 100; // Simulated
      
      const metrics: PerformanceMetrics = {
        responseTime,
        throughput,
        errorRate,
        memoryUsage,
        cpuUsage
      };
      
      this.log('INFO', 'HEALTH_CHECK', 'System health check completed', metrics);
      
      // Record performance metrics
      this.recordMetric('response_time', responseTime, 'ms');
      this.recordMetric('throughput', throughput, 'tpm'); // transactions per minute
      this.recordMetric('error_rate', errorRate, 'percent');
      this.recordMetric('memory_usage', memoryUsage, 'MB');
      this.recordMetric('cpu_usage', cpuUsage, 'percent');
      
      return metrics;
      
    } catch (error) {
      this.log('ERROR', 'HEALTH_CHECK', `Health check failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generate comprehensive transaction metrics
   */
  getTransactionMetrics(): TransactionMetrics {
    const transactionLogs = this.logs.filter(log => log.category === 'PAYMENT');
    const successfulTransactions = transactionLogs.filter(log => log.level === 'INFO' && log.message.includes('completed successfully')).length;
    const failedTransactions = transactionLogs.filter(log => log.level === 'ERROR').length;
    const totalTransactions = successfulTransactions + failedTransactions;
    
    // Calculate total volume
    const volumeMetrics = this.metrics.filter(m => m.metric === 'transaction_volume' && m.tags?.status === 'success');
    const totalVolume = volumeMetrics.reduce((sum, m) => sum + BigInt(Math.round(m.value * 1e18)), BigInt(0));
    
    // Calculate average gas used
    const gasMetrics = this.metrics.filter(m => m.metric === 'gas_used' && m.tags?.status === 'success');
    const averageGasUsed = gasMetrics.length > 0 ? gasMetrics.reduce((sum, m) => sum + m.value, 0) / gasMetrics.length : 0;
    
    // Calculate average transaction time
    const timeMetrics = this.metrics.filter(m => m.metric === 'transaction_duration' && m.tags?.status === 'success');
    const averageTransactionTime = timeMetrics.length > 0 ? timeMetrics.reduce((sum, m) => sum + m.value, 0) / timeMetrics.length : 0;
    
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
    
    return {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      totalVolume,
      averageGasUsed,
      averageTransactionTime,
      successRate
    };
  }

  /**
   * Generate real-time dashboard data
   */
  generateDashboard(): any {
    const transactionMetrics = this.getTransactionMetrics();
    const recentLogs = this.logs.slice(-10);
    const recentMetrics = this.metrics.slice(-20);
    
    // Error breakdown
    const errorLogs = this.logs.filter(log => log.level === 'ERROR');
    const errorBreakdown = errorLogs.reduce((acc, log) => {
      const errorType = this.categorizeError(log.message);
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Performance trends
    const performanceTrends = {
      responseTime: this.getMetricTrend('response_time'),
      throughput: this.getMetricTrend('throughput'),
      errorRate: this.getMetricTrend('error_rate')
    };
    
    return {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      transactionMetrics,
      errorBreakdown,
      performanceTrends,
      recentLogs: recentLogs.map(log => ({
        timestamp: log.timestamp,
        level: log.level,
        category: log.category,
        message: log.message
      })),
      recentMetrics: recentMetrics.map(metric => ({
        timestamp: metric.timestamp,
        metric: metric.metric,
        value: metric.value,
        unit: metric.unit
      }))
    };
  }

  /**
   * Export logs and metrics for external analysis
   */
  exportData(): { logs: LogEntry[], metrics: MetricData[] } {
    this.log('INFO', 'EXPORT', `Exporting ${this.logs.length} logs and ${this.metrics.length} metrics`);
    
    // Write to files
    const exportData = {
      logs: this.logs,
      metrics: this.metrics,
      exportedAt: Date.now()
    };
    
    fs.writeFileSync(this.metricsFilePath, JSON.stringify(exportData, null, 2));
    
    return { logs: this.logs, metrics: this.metrics };
  }

  /**
   * Set up automated monitoring alerts
   */
  setupAlerts(): void {
    this.log('INFO', 'ALERTS', 'Setting up monitoring alerts');
    
    // Check for high error rate every minute
    setInterval(() => {
      const errorRate = this.calculateErrorRate();
      if (errorRate > 10) { // Alert if error rate > 10%
        this.log('WARN', 'ALERT', `High error rate detected: ${errorRate.toFixed(2)}%`);
      }
    }, 60000);
    
    // Check for low balance every 5 minutes
    setInterval(async () => {
      try {
        const balance = await this.sdk.getBalance(this.sdk.getConfig().defaultNetwork);
        const balanceETH = Number(ethers.formatEther(balance));
        if (balanceETH < 1) { // Alert if balance < 1 STT
          this.log('WARN', 'ALERT', `Low wallet balance: ${balanceETH.toFixed(4)} STT`);
        }
      } catch (error) {
        this.log('ERROR', 'ALERT', `Failed to check balance: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, 300000);
  }

  /**
   * Helper methods
   */
  private getLevelColor(level: LogEntry['level']): string {
    switch (level) {
      case 'ERROR': return '\x1b[31m'; // Red
      case 'WARN': return '\x1b[33m';  // Yellow
      case 'INFO': return '\x1b[32m';  // Green
      case 'DEBUG': return '\x1b[36m'; // Cyan
      default: return '\x1b[0m';       // Reset
    }
  }

  private writeLogToFile(entry: LogEntry): void {
    const logLine = `${new Date(entry.timestamp).toISOString()} [${entry.level}] ${entry.category}: ${entry.message}\n`;
    fs.appendFileSync(this.logFilePath, logLine);
  }

  private categorizeError(error: string): string {
    const errorLower = error.toLowerCase();
    if (errorLower.includes('insufficient')) return 'Insufficient Funds';
    if (errorLower.includes('network') || errorLower.includes('connection')) return 'Network Error';
    if (errorLower.includes('gas')) return 'Gas Error';
    if (errorLower.includes('timeout')) return 'Timeout';
    if (errorLower.includes('limit')) return 'Limit Exceeded';
    return 'Other';
  }

  private calculateErrorRate(): number {
    const recentLogs = this.logs.filter(log => log.timestamp > Date.now() - 300000); // Last 5 minutes
    const errorLogs = recentLogs.filter(log => log.level === 'ERROR');
    return recentLogs.length > 0 ? (errorLogs.length / recentLogs.length) * 100 : 0;
  }

  private getMetricTrend(metricName: string): number[] {
    return this.metrics
      .filter(m => m.metric === metricName)
      .slice(-10)
      .map(m => m.value);
  }
}

/**
 * Demonstrate production monitoring capabilities
 */
async function demonstrateMonitoring(): Promise<void> {
  console.log(`📊 X402 SDK - Production Monitoring Demo`);
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
    
    // Initialize monitor
    const monitor = new ProductionMonitor(sdk);
    
    // Setup alerts
    monitor.setupAlerts();
    
    console.log(`\n🔍 Running monitoring scenarios...`);
    
    // Scenario 1: Monitor successful payment
    console.log(`\n📋 Scenario 1: Monitoring Successful Payment`);
    try {
      await monitor.monitorPayment({
        amount: ethers.parseEther('0.001'),
        recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
        metadata: { service: 'test_service', type: 'monitoring_demo' }
      });
    } catch (error) {
      console.log(`ℹ️  Payment monitoring failed (expected if insufficient balance)`);
    }
    
    // Scenario 2: System health monitoring
    console.log(`\n📋 Scenario 2: System Health Monitoring`);
    const healthMetrics = await monitor.monitorSystemHealth();
    console.log(`📊 Health Metrics:`, healthMetrics);
    
    // Scenario 3: Generate dashboard
    console.log(`\n📋 Scenario 3: Real-time Dashboard`);
    const dashboard = monitor.generateDashboard();
    console.log(`📈 Dashboard Data:`);
    console.log(JSON.stringify(dashboard, (_key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2
    ));
    
    // Scenario 4: Export data
    console.log(`\n📋 Scenario 4: Data Export`);
    const exportedData = monitor.exportData();
    console.log(`📁 Exported ${exportedData.logs.length} logs and ${exportedData.metrics.length} metrics`);
    
    // Scenario 5: Transaction metrics
    console.log(`\n📋 Scenario 5: Transaction Analytics`);
    const transactionMetrics = monitor.getTransactionMetrics();
    console.log(`📊 Transaction Metrics:`);
    console.log(JSON.stringify(transactionMetrics, (_key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2
    ));
    
    console.log(`\n✅ Monitoring demonstration completed!`);
    console.log(`\n💡 Key Monitoring Features:`);
    console.log(`   • Structured logging with multiple levels`);
    console.log(`   • Real-time metrics collection`);
    console.log(`   • Transaction state monitoring`);
    console.log(`   • Performance analytics`);
    console.log(`   • Automated alerting system`);
    console.log(`   • Data export capabilities`);
    console.log(`   • Real-time dashboard generation`);
    console.log(`   • Error categorization and tracking`);
    
  } catch (error) {
    console.error(`❌ Monitoring demo failed:`, error instanceof Error ? error.message : String(error));
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateMonitoring().catch(console.error);
}

export { ProductionMonitor, demonstrateMonitoring };