/**
 * X402 SDK - Wallet Type Definitions
 */

export interface WalletConfig {
  privateKey?: string;
  mnemonic?: string;
  password?: string;
  autoLock?: boolean;
  lockTimeout?: number;
}

export interface WalletState {
  isInitialized: boolean;
  isLocked: boolean;
  address: string | null;
  balance: string;
  network: string;
}

export interface WalletBackup {
  encryptedData: string;
  timestamp: number;
  version: string;
}

export interface WalletRecoveryOptions {
  mnemonic?: string;
  privateKey?: string;
  encryptedBackup?: string;
  password: string;
}

export interface EmbeddedWalletConfig extends WalletConfig {
  password: string;
  network?: string;
  storage?: any;
  storagePrefix?: string;
  autoSave?: boolean;
  biometricAuth?: boolean;
  customRpcUrls?: any;
  defaultTransactionConfig?: any;
}

export interface WalletManagerConfig {
  privateKey?: string;
  mnemonic?: string;
  customRpcUrls?: any;
  defaultTransactionConfig?: any;
}