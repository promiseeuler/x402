import { ethers } from 'ethers';
import { WalletConfig, SpendingLimit, X402Error, X402ErrorCode, NetworkConfig } from '../types/index.js';

/**
 * Wallet manager for X402 payments
 * Handles wallet creation, spending limits, and transaction management
 */
export class X402WalletManager {
  private wallet: ethers.Wallet | ethers.HDNodeWallet | null = null;
  private provider: ethers.Provider;
  private spendingLimits: Map<string, SpendingLimit> = new Map();
  private spentAmounts: Map<string, { amount: number; resetTime: number }> = new Map();
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig, provider?: ethers.Provider) {
    this.networkConfig = networkConfig;
    this.provider = provider || new ethers.JsonRpcProvider(networkConfig.rpcUrl);
  }

  /**
   * Create a new wallet
   * @param config - Wallet configuration options
   * @returns Wallet configuration with address and encrypted private key
   */
  async createWallet(config: {
    password: string;
    entropy?: string;
  }): Promise<WalletConfig> {
    try {
      // Generate new wallet
      const wallet = config.entropy 
        ? ethers.Wallet.fromPhrase(config.entropy)
        : ethers.Wallet.createRandom();

      // Encrypt private key
      const encryptedPrivateKey = await wallet.encrypt(config.password);

      // Store wallet instance
      this.wallet = wallet.connect(this.provider);

      return {
        address: wallet.address,
        encryptedPrivateKey,
        network: this.networkConfig.name,
        createdAt: Date.now()
      };
    } catch (error) {
      throw new X402Error(
        `Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.WALLET_ERROR,
        error
      );
    }
  }

  /**
   * Load wallet from encrypted private key
   * @param encryptedPrivateKey - Encrypted private key JSON
   * @param password - Password to decrypt the private key
   * @returns Wallet address
   */
  async loadWallet(encryptedPrivateKey: string, password: string): Promise<string> {
    try {
      const wallet = await ethers.Wallet.fromEncryptedJson(encryptedPrivateKey, password);
      this.wallet = wallet.connect(this.provider);
      return wallet.address;
    } catch (error) {
      throw new X402Error(
        `Failed to load wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.WALLET_ERROR,
        error
      );
    }
  }

  /**
   * Load wallet from private key (less secure, for development)
   * @param privateKey - Raw private key
   * @returns Wallet address
   */
  loadWalletFromPrivateKey(privateKey: string): string {
    try {
      const wallet = new ethers.Wallet(privateKey);
      this.wallet = wallet.connect(this.provider);
      return wallet.address;
    } catch (error) {
      throw new X402Error(
        `Failed to load wallet from private key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.WALLET_ERROR,
        error
      );
    }
  }

  /**
   * Get current wallet instance
   * @returns Connected wallet or null if not loaded
   */
  getWallet(): ethers.Wallet | ethers.HDNodeWallet | null {
    return this.wallet;
  }

  /**
   * Get wallet address
   * @returns Wallet address or null if not loaded
   */
  getAddress(): string | null {
    return this.wallet?.address || null;
  }

  /**
   * Get the provider instance
   * @returns The ethers provider
   */
  getProvider(): ethers.Provider {
    return this.provider;
  }

  /**
   * Get wallet balance for native token
   * @returns Balance in ETH/STT
   */
  async getBalance(): Promise<string> {
    if (!this.wallet) {
      throw new X402Error('No wallet loaded', X402ErrorCode.WALLET_ERROR);
    }

    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new X402Error(
        `Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Get token balance for ERC-20 tokens
   * @param tokenAddress - Token contract address
   * @returns Token balance
   */
  async getTokenBalance(tokenAddress: string): Promise<string> {
    if (!this.wallet) {
      throw new X402Error('No wallet loaded', X402ErrorCode.WALLET_ERROR);
    }

    try {
      const tokenContract = new ethers.Contract(tokenAddress, [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ], this.provider);

      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(this.wallet.address),
        tokenContract.decimals()
      ]);

      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      throw new X402Error(
        `Failed to get token balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Set spending limit for a token
   * @param token - Token symbol or address
   * @param limit - Spending limit configuration
   */
  setSpendingLimit(token: string, limit: SpendingLimit): void {
    this.spendingLimits.set(token.toLowerCase(), limit);
  }

  /**
   * Get spending limit for a token
   * @param token - Token symbol or address
   * @returns Spending limit or null if not set
   */
  getSpendingLimit(token: string): SpendingLimit | null {
    return this.spendingLimits.get(token.toLowerCase()) || null;
  }

  /**
   * Check if a payment amount is within spending limits
   * @param token - Token symbol or address
   * @param amount - Payment amount
   * @returns True if within limits, false otherwise
   */
  checkSpendingLimit(token: string, amount: string): boolean {
    const limit = this.getSpendingLimit(token);
    if (!limit) {
      return true; // No limit set
    }

    const paymentAmount = parseFloat(amount);
    const tokenKey = token.toLowerCase();
    const now = Date.now();

    // Check per-transaction limit
    if (limit.perTransaction && paymentAmount > limit.perTransaction) {
      return false;
    }

    // Check daily limit
    if (limit.daily) {
      const spent = this.spentAmounts.get(tokenKey);
      const dayStart = Math.floor(now / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);

      if (!spent || spent.resetTime < dayStart) {
        // Reset daily spending
        this.spentAmounts.set(tokenKey, { amount: paymentAmount, resetTime: dayStart });
      } else {
        const newTotal = spent.amount + paymentAmount;
        if (newTotal > limit.daily) {
          return false;
        }
        this.spentAmounts.set(tokenKey, { amount: newTotal, resetTime: spent.resetTime });
      }
    }

    return true;
  }

  /**
   * Record a successful payment for spending limit tracking
   * @param token - Token symbol or address
   * @param amount - Payment amount
   */
  recordPayment(token: string, amount: string): void {
    const paymentAmount = parseFloat(amount);
    const tokenKey = token.toLowerCase();
    const now = Date.now();
    const dayStart = Math.floor(now / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);

    const spent = this.spentAmounts.get(tokenKey);
    if (!spent || spent.resetTime < dayStart) {
      this.spentAmounts.set(tokenKey, { amount: paymentAmount, resetTime: dayStart });
    } else {
      this.spentAmounts.set(tokenKey, { 
        amount: spent.amount + paymentAmount, 
        resetTime: spent.resetTime 
      });
    }
  }

  /**
   * Get remaining spending allowance for a token
   * @param token - Token symbol or address
   * @returns Remaining allowance information
   */
  getRemainingAllowance(token: string): {
    perTransaction?: number;
    daily?: number;
    spent?: number;
  } {
    const limit = this.getSpendingLimit(token);
    if (!limit) {
      return {};
    }

    const tokenKey = token.toLowerCase();
    const spent = this.spentAmounts.get(tokenKey);
    const now = Date.now();
    const dayStart = Math.floor(now / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);

    let dailySpent = 0;
    if (spent && spent.resetTime >= dayStart) {
      dailySpent = spent.amount;
    }

    const result: {
      perTransaction?: number;
      daily?: number;
      spent?: number;
    } = {
      spent: dailySpent
    };
    
    if (limit.perTransaction !== undefined) {
      result.perTransaction = limit.perTransaction;
    }
    
    if (limit.daily !== undefined) {
      result.daily = limit.daily - dailySpent;
    }
    
    return result;
  }

  /**
   * Sign a message with the loaded wallet
   * @param message - Message to sign
   * @returns Signature
   */
  async signMessage(message: string): Promise<string> {
    if (!this.wallet) {
      throw new X402Error('No wallet loaded', X402ErrorCode.WALLET_ERROR);
    }

    try {
      return await this.wallet.signMessage(message);
    } catch (error) {
      throw new X402Error(
        `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.WALLET_ERROR,
        error
      );
    }
  }

  /**
   * Sign typed data (EIP-712)
   * @param domain - Domain separator
   * @param types - Type definitions
   * @param value - Value to sign
   * @returns Signature
   */
  async signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>
  ): Promise<string> {
    if (!this.wallet) {
      throw new X402Error('No wallet loaded', X402ErrorCode.WALLET_ERROR);
    }

    try {
      return await this.wallet.signTypedData(domain, types, value);
    } catch (error) {
      throw new X402Error(
        `Failed to sign typed data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.WALLET_ERROR,
        error
      );
    }
  }

  /**
   * Clear wallet from memory (security)
   */
  clearWallet(): void {
    this.wallet = null;
  }

  /**
   * Export wallet configuration (without private key)
   * @returns Public wallet information
   */
  exportWalletInfo(): {
    address: string | null;
    network: string;
    spendingLimits: Record<string, SpendingLimit>;
  } {
    const spendingLimitsObj: Record<string, SpendingLimit> = {};
    this.spendingLimits.forEach((limit, token) => {
      spendingLimitsObj[token] = limit;
    });

    return {
      address: this.getAddress(),
      network: this.networkConfig.name,
      spendingLimits: spendingLimitsObj
    };
  }
}