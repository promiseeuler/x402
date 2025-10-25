/**
 * Wallet management for X402 SDK
 * Handles transaction signing across multiple networks
 */

import { ethers, Wallet, HDNodeWallet, JsonRpcProvider, TransactionRequest, TransactionResponse } from 'ethers';
import { NetworkName, TransactionConfig, NetworkError, NetworkErrorCode } from '../types/network';
import { getNetworkConfig } from '../protocol/networks';

export interface WalletManagerConfig {
  /** Private key for wallet */
  privateKey?: string;
  /** Mnemonic phrase for wallet generation */
  mnemonic?: string;
  /** Custom RPC URLs for networks */
  customRpcUrls?: Partial<Record<NetworkName, string>>;
  /** Default transaction configuration */
  defaultTransactionConfig?: TransactionConfig;
}

export class WalletManager {
  private wallet: Wallet | HDNodeWallet | null = null;
  private providers: Map<NetworkName, JsonRpcProvider> = new Map();
  private config: WalletManagerConfig;

  constructor(config: WalletManagerConfig) {
    this.config = config;
    
    if (config.privateKey) {
      this.wallet = new Wallet(config.privateKey);
    } else if (config.mnemonic) {
      this.wallet = Wallet.fromPhrase(config.mnemonic);
    }
    // Don't automatically create random wallet - let it be null until explicitly created
  }

  /**
   * Create wallet from private key
   */
  async createFromPrivateKey(privateKey: string): Promise<void> {
    this.wallet = new Wallet(privateKey);
  }

  /**
   * Create wallet from mnemonic
   */
  async createFromMnemonic(mnemonic: string): Promise<void> {
    this.wallet = Wallet.fromPhrase(mnemonic);
  }

  /**
   * Create random wallet
   */
  async createRandom(): Promise<void> {
    this.wallet = Wallet.createRandom();
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet.address;
  }

  /**
   * Get wallet private key (use with caution)
   */
  getPrivateKey(): string {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet.privateKey;
  }

  /**
   * Get provider for a specific network
   */
  getProvider(network: NetworkName): JsonRpcProvider {
    if (!this.providers.has(network)) {
      const networkConfig = getNetworkConfig(network);
      const rpcUrl = this.config.customRpcUrls?.[network] || networkConfig.rpcUrl;
      const provider = new JsonRpcProvider(rpcUrl, {
        chainId: networkConfig.chainId,
        name: networkConfig.name
      });
      this.providers.set(network, provider);
    }
    return this.providers.get(network)!;
  }

  /**
   * Get wallet connected to a specific network
   */
  getConnectedWallet(network: NetworkName): Wallet {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    const provider = this.getProvider(network);
    return this.wallet.connect(provider) as Wallet;
  }

  /**
   * Get balance for a specific token on a network
   */
  async getBalance(network: NetworkName, tokenAddress?: string): Promise<string> {
    try {
      const wallet = this.getConnectedWallet(network);
      
      if (!tokenAddress) {
        // Get native token balance
        if (!wallet.provider) {
          throw new Error('Wallet provider not available');
        }
        const balance = await wallet.provider.getBalance(wallet.address);
        return ethers.formatEther(balance);
      } else {
        // Get ERC-20 token balance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
          wallet
        );
        const [balance, decimals] = await Promise.all([
          tokenContract['balanceOf'](wallet.address),
          tokenContract['decimals']()
        ]);
        return ethers.formatUnits(balance, decimals);
      }
    } catch (error) {
      throw this.createNetworkError(NetworkErrorCode.RPC_ERROR, `Failed to get balance: ${error}`, network);
    }
  }

  /**
   * Send native token transaction
   */
  async sendTransaction(
    network: NetworkName,
    to: string,
    amount: string,
    transactionConfig?: TransactionConfig
  ): Promise<TransactionResponse> {
    try {
      const wallet = this.getConnectedWallet(network);
      const networkConfig = getNetworkConfig(network);
      
      const tx: TransactionRequest = {
        to,
        value: ethers.parseUnits(amount, networkConfig.nativeToken.decimals),
        ...this.buildTransactionConfig(transactionConfig)
      };

      return await wallet.sendTransaction(tx);
    } catch (error) {
      throw this.createNetworkError(NetworkErrorCode.TRANSACTION_FAILED, `Transaction failed: ${error}`, network);
    }
  }

  /**
   * Send ERC-20 token transaction
   */
  async sendTokenTransaction(
    network: NetworkName,
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number,
    transactionConfig?: TransactionConfig
  ): Promise<TransactionResponse> {
    try {
      const wallet = this.getConnectedWallet(network);
      
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        wallet
      );

      const tx = await tokenContract['transfer'](
        to,
        ethers.parseUnits(amount, decimals),
        this.buildTransactionConfig(transactionConfig)
      );

      return tx;
    } catch (error) {
      throw this.createNetworkError(NetworkErrorCode.TRANSACTION_FAILED, `Token transfer failed: ${error}`, network);
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    network: NetworkName,
    to: string,
    data?: string,
    value?: string
  ): Promise<bigint> {
    try {
      const provider = this.getProvider(network);
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }
      const tx: TransactionRequest = {
        from: this.wallet.address,
        to,
        ...(data && { data }),
        ...(value && { value: ethers.parseEther(value) })
      };
      
      return await provider.estimateGas(tx);
    } catch (error) {
      throw this.createNetworkError(NetworkErrorCode.GAS_ESTIMATION_FAILED, `Gas estimation failed: ${error}`, network);
    }
  }

  /**
   * Get current gas price for a network
   */
  async getGasPrice(network: NetworkName): Promise<bigint> {
    try {
      const provider = this.getProvider(network);
      const feeData = await provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      throw this.createNetworkError(NetworkErrorCode.RPC_ERROR, `Failed to get gas price: ${error}`, network);
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    network: NetworkName,
    txHash: string,
    confirmations: number = 1,
    timeout?: number
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      const provider = this.getProvider(network);
      return await provider.waitForTransaction(txHash, confirmations, timeout);
    } catch (error) {
      throw this.createNetworkError(NetworkErrorCode.TRANSACTION_FAILED, `Transaction confirmation failed: ${error}`, network);
    }
  }

  /**
   * Check if wallet has sufficient balance for a transaction
   */
  async hasSufficientBalance(
    network: NetworkName,
    amount: string,
    tokenAddress?: string
  ): Promise<boolean> {
    try {
      const balance = await this.getBalance(network, tokenAddress);
      return parseFloat(balance) >= parseFloat(amount);
    } catch (error) {
      return false;
    }
  }

  /**
   * Build transaction configuration
   */
  private buildTransactionConfig(config?: TransactionConfig): Partial<TransactionRequest> {
    const defaultConfig = this.config.defaultTransactionConfig;
    const mergedConfig = { ...defaultConfig, ...config };
    
    const txConfig: Partial<TransactionRequest> = {};
    
    if (mergedConfig.gasLimit) {
      txConfig.gasLimit = BigInt(mergedConfig.gasLimit);
    }
    
    if (mergedConfig.gasPrice) {
      txConfig.gasPrice = BigInt(mergedConfig.gasPrice);
    }
    
    if (mergedConfig.maxFeePerGas) {
      txConfig.maxFeePerGas = BigInt(mergedConfig.maxFeePerGas);
    }
    
    if (mergedConfig.maxPriorityFeePerGas) {
      txConfig.maxPriorityFeePerGas = BigInt(mergedConfig.maxPriorityFeePerGas);
    }
    
    return txConfig;
  }

  /**
   * Create a network error
   */
  private createNetworkError(code: NetworkErrorCode, message: string, network?: NetworkName): NetworkError {
    const networkConfig = network ? getNetworkConfig(network) : undefined;
    return {
      code,
      message,
      ...(network && { network }),
      ...(networkConfig?.chainId && { chainId: networkConfig.chainId })
    };
  }

  /**
   * Disconnect all providers
   */
  disconnect(): void {
    this.providers.clear();
  }
}