import { ethers } from 'ethers';
import { PaymentRequirement, PaymentPayload, VerificationResponse, X402Error, X402ErrorCode } from '../types/index.js';

/**
 * Payment facilitator for executing and verifying X402 payments
 * Configured for Somnia Testnet by default
 */
export class PaymentFacilitator {
  private provider: ethers.Provider;
  private networkConfig: {
    chainId: number;
    name: string;
    rpcUrl: string;
    currency: string;
    explorer: string;
  };

  constructor(provider?: ethers.Provider, customNetwork?: any) {
    // Default to Somnia Testnet configuration
    this.networkConfig = customNetwork || {
      chainId: 50312, // 0xc488
      name: 'Somnia Testnet',
      rpcUrl: 'https://dream-rpc.somnia.network',
      currency: 'STT',
      explorer: 'https://shannon-explorer.somnia.network/'
    };

    this.provider = provider || new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
  }

  /**
   * Execute a payment based on payment requirement
   * @param requirement - Payment requirement from X402 response
   * @param wallet - Ethers wallet instance
   * @returns Payment transaction hash
   */
  async executePayment(
    requirement: PaymentRequirement,
    wallet: ethers.Wallet | ethers.HDNodeWallet
  ): Promise<string> {
    try {
      // Validate network compatibility
      if (requirement.network !== 'somnia' && requirement.network !== 'ethereum') {
        throw new X402Error(
          `Unsupported network: ${requirement.network}`,
          X402ErrorCode.UNSUPPORTED_NETWORK
        );
      }

      // Check if payment has expired
      if (requirement.expiry && Date.now() > requirement.expiry * 1000) {
        throw new X402Error(
          'Payment requirement has expired',
          X402ErrorCode.PAYMENT_EXPIRED
        );
      }

      // Connect wallet to provider
      const connectedWallet = wallet.connect(this.provider);

      // Prepare transaction based on scheme
      let transaction: ethers.TransactionRequest;

      switch (requirement.scheme) {
        case 'exact':
          transaction = await this.prepareExactPayment(requirement, connectedWallet);
          break;
        case 'upto':
          transaction = await this.prepareUpToPayment(requirement, connectedWallet);
          break;
        default:
          throw new X402Error(
            `Unsupported payment scheme: ${requirement.scheme}`,
            X402ErrorCode.UNSUPPORTED_SCHEME
          );
      }

      // Execute transaction
      const tx = await connectedWallet.sendTransaction(transaction);
      
      return tx.hash;
    } catch (error) {
      if (error instanceof X402Error) {
        throw error;
      }
      throw new X402Error(
        `Payment execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.PAYMENT_FAILED,
        error
      );
    }
  }

  /**
   * Verify payment transaction
   * @param txHash - Transaction hash
   * @param requirement - Original payment requirement
   * @returns Verification response
   */
  async verifyPayment(
    txHash: string,
    requirement: PaymentRequirement
  ): Promise<VerificationResponse> {
    try {
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return {
          valid: false,
          txHash,
          error: 'Transaction not found or not mined yet'
        };
      }

      // Check if transaction was successful
      if (receipt.status !== 1) {
        return {
          valid: false,
          txHash,
          error: 'Transaction failed'
        };
      }

      // Get transaction details
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return {
          valid: false,
          txHash,
          error: 'Transaction details not found'
        };
      }

      // Verify payment details match requirement
      const verification = this.validatePaymentDetails(tx, receipt, requirement);
      
      return {
        valid: verification.valid,
        txHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString(),
        error: verification.error
      };
    } catch (error) {
      return {
        valid: false,
        txHash,
        error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Prepare exact payment transaction
   */
  private async prepareExactPayment(
    requirement: PaymentRequirement,
    wallet: ethers.Wallet
  ): Promise<ethers.TransactionRequest> {
    const amount = ethers.parseEther(requirement.amount);
    
    // For native token payments (STT on Somnia)
    if (requirement.token === 'native' || requirement.token === 'STT') {
      return {
        to: requirement.payTo,
        value: amount,
        gasLimit: 21000 // Standard gas limit for simple transfer
      };
    }

    // For ERC-20 token payments
    const tokenContract = new ethers.Contract(
      requirement.token,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      wallet
    );

    const data = tokenContract.interface.encodeFunctionData('transfer', [
      requirement.payTo,
      amount
    ]);

    return {
      to: requirement.token,
      data,
      gasLimit: 60000 // Higher gas limit for token transfer
    };
  }

  /**
   * Prepare up-to payment transaction
   */
  private async prepareUpToPayment(
    requirement: PaymentRequirement,
    wallet: ethers.Wallet
  ): Promise<ethers.TransactionRequest> {
    // For 'upto' scheme, we pay the exact amount specified
    // In a more advanced implementation, this could be dynamic
    return this.prepareExactPayment(requirement, wallet);
  }

  /**
   * Validate payment details against requirement
   */
  private validatePaymentDetails(
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    requirement: PaymentRequirement
  ): { valid: boolean; error?: string } {
    // Check recipient address
    if (tx.to?.toLowerCase() !== requirement.payTo.toLowerCase()) {
      // For token transfers, check if it's a contract call
      if (requirement.token !== 'native' && requirement.token !== 'STT') {
        if (tx.to?.toLowerCase() !== requirement.token.toLowerCase()) {
          return { valid: false, error: 'Incorrect recipient or token contract' };
        }
      } else {
        return { valid: false, error: 'Incorrect recipient address' };
      }
    }

    // For native token payments, check value
    if (requirement.token === 'native' || requirement.token === 'STT') {
      const expectedAmount = ethers.parseEther(requirement.amount);
      if (tx.value !== expectedAmount) {
        return { valid: false, error: 'Incorrect payment amount' };
      }
    }

    // Additional validations can be added here
    // For example, parsing token transfer events for ERC-20 payments

    return { valid: true };
  }

  /**
   * Get network information
   */
  getNetworkConfig() {
    return { ...this.networkConfig };
  }

  /**
   * Estimate gas for a payment
   */
  async estimateGas(
    requirement: PaymentRequirement,
    wallet: ethers.Wallet
  ): Promise<bigint> {
    try {
      const connectedWallet = wallet.connect(this.provider);
      const transaction = await this.prepareExactPayment(requirement, connectedWallet);
      return await this.provider.estimateGas(transaction);
    } catch (error) {
      throw new X402Error(
        `Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.PAYMENT_FAILED,
        error
      );
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      throw new X402Error(
        `Failed to get gas price: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.NETWORK_ERROR,
        error
      );
    }
  }
}