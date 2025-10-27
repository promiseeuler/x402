/**
 * Wallet module exports
 */

export { WalletManager } from './WalletManager';
export type { WalletManagerConfig } from './WalletManager';
export { EmbeddedWalletManager } from './EmbeddedWalletManager';
export type { EmbeddedWalletConfig, WalletBackup, WalletRecoveryOptions } from './EmbeddedWalletManager';

// Re-export useful ethers types
export { TransactionResponse, TransactionReceipt } from 'ethers';