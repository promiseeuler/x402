/**
 * Professional Embedded Wallet Manager for X402 SDK
 * Provides secure wallet management with recovery, encryption, and backup features
 */

import { Wallet, HDNodeWallet } from 'ethers';
import { WalletManager } from './WalletManager';
import { NetworkName } from '../types/network';

export interface EmbeddedWalletConfig {
  /** Password for wallet encryption */
  password: string;
  /** Network name */
  network?: string;
  /** Storage key prefix for localStorage */
  storagePrefix?: string;
  /** Auto-save wallet to storage */
  autoSave?: boolean;
  /** Enable biometric authentication (future feature) */
  biometricAuth?: boolean;
  /** Auto-lock wallet */
  autoLock?: boolean;
  /** Lock timeout in milliseconds */
  lockTimeout?: number;
  /** Private key for wallet initialization */
  privateKey?: string;
  /** Mnemonic for wallet initialization */
  mnemonic?: string;
  /** Custom RPC URLs */
  customRpcUrls?: any;
  /** Default transaction configuration */
  defaultTransactionConfig?: any;
}

export interface WalletBackup {
  /** Encrypted wallet data */
  encryptedWallet: string;
  /** Wallet address for verification */
  address: string;
  /** Backup timestamp */
  timestamp: number;
  /** Backup version */
  version: string;
}

export interface WalletRecoveryOptions {
  /** Mnemonic phrase for recovery */
  mnemonic?: string;
  /** Private key for recovery */
  privateKey?: string;
  /** Encrypted wallet backup */
  encryptedBackup?: string;
  /** Password for decryption */
  password: string;
}

export class EmbeddedWalletManager extends WalletManager {
  private embeddedConfig: EmbeddedWalletConfig;
  private isLocked: boolean = true;
  private encryptedWallet: string | null = null;
  private storageKey: string;

  constructor(config: EmbeddedWalletConfig) {
    super({
      privateKey: config.privateKey,
      mnemonic: config.mnemonic,
      customRpcUrls: config.customRpcUrls,
      defaultTransactionConfig: config.defaultTransactionConfig
    });
    this.embeddedConfig = {
      storagePrefix: 'x402_wallet',
      autoSave: true,
      biometricAuth: false,
      ...config
    };
    this.storageKey = `${this.embeddedConfig.storagePrefix || 'x402_wallet'}_data`;
    
    if (config.autoLock && config.lockTimeout) {
      this.setupAutoLock(config.lockTimeout);
    }
  }

  /**
   * Create a new wallet with password protection
   */
  async createSecureWallet(password: string): Promise<{ mnemonic: string; address: string }> {
    const wallet = Wallet.createRandom();
    await this.setWallet(wallet, password);
    
    const mnemonic = wallet.mnemonic?.phrase || '';
    return {
      mnemonic,
      address: wallet.address
    };
  }

  /**
   * Import wallet from mnemonic with password protection
   */
  async importFromMnemonic(mnemonic: string, password: string): Promise<string> {
    try {
      const wallet = Wallet.fromPhrase(mnemonic);
      await this.setWallet(wallet, password);
      return wallet.address;
    } catch (error) {
      throw new Error(`Failed to import wallet from mnemonic: ${error}`);
    }
  }

  /**
   * Import wallet from private key with password protection
   */
  async importFromPrivateKey(privateKey: string, password: string): Promise<string> {
    try {
      const wallet = new Wallet(privateKey);
      await this.setWallet(wallet, password);
      return wallet.address;
    } catch (error) {
      throw new Error(`Failed to import wallet from private key: ${error}`);
    }
  }

  /**
   * Unlock wallet with password
   */
  async unlock(password: string): Promise<boolean> {
    try {
      if (!this.encryptedWallet) {
        // Try to load from storage
        await this.loadFromStorage();
      }

      if (!this.encryptedWallet) {
        throw new Error('No wallet found');
      }

      const decryptedWallet = await this.decryptWallet(this.encryptedWallet, password);
      await this.createFromPrivateKey(decryptedWallet.privateKey);
      this.isLocked = false;
      return true;
    } catch (error) {
      throw new Error(`Failed to unlock wallet: ${error}`);
    }
  }

  /**
   * Lock the wallet
   */
  lock(): void {
    this.isLocked = true;
    // Clear sensitive data from memory
    // Note: The parent class wallet will still exist but access will be restricted
  }

  /**
   * Check if wallet is locked
   */
  isWalletLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Export wallet mnemonic (requires unlocked wallet)
   */
  async exportMnemonic(): Promise<string> {
    this.ensureUnlocked();
    const wallet = this.getWalletInstance();
    if ('mnemonic' in wallet && wallet.mnemonic) {
      return wallet.mnemonic.phrase;
    }
    throw new Error('Wallet was not created from mnemonic');
  }

  /**
   * Export wallet private key (requires unlocked wallet)
   */
  async exportPrivateKey(): Promise<string> {
    this.ensureUnlocked();
    return this.getPrivateKey();
  }

  /**
   * Create encrypted backup of wallet
   */
  async createBackup(password: string): Promise<WalletBackup> {
    this.ensureUnlocked();
    
    const wallet = this.getWalletInstance();
    const encryptedWallet = await this.encryptWallet(wallet, password);
    
    return {
      encryptedWallet,
      address: wallet.address,
      timestamp: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * Restore wallet from backup
   */
  async restoreFromBackup(backup: WalletBackup, password: string): Promise<string> {
    try {
      const wallet = await this.decryptWallet(backup.encryptedWallet, password);
      
      // Verify address matches
      if (wallet.address !== backup.address) {
        throw new Error('Backup verification failed: address mismatch');
      }
      
      await this.setWallet(wallet, password);
      return wallet.address;
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error}`);
    }
  }

  /**
   * Save wallet to browser storage
   */
  async saveToStorage(): Promise<void> {
    if (!this.encryptedWallet) {
      throw new Error('No encrypted wallet to save');
    }

    try {
      const walletData = {
        encryptedWallet: this.encryptedWallet,
        address: this.getAddress(),
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(walletData));
    } catch (error) {
      throw new Error(`Failed to save wallet to storage: ${error}`);
    }
  }

  /**
   * Load wallet from browser storage
   */
  async loadFromStorage(): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return false;
      }

      const walletData = JSON.parse(stored);
      this.encryptedWallet = walletData.encryptedWallet;
      return true;
    } catch (error) {
      throw new Error(`Failed to load wallet from storage: ${error}`);
    }
  }

  /**
   * Clear wallet from storage
   */
  async clearStorage(): Promise<void> {
    localStorage.removeItem(this.storageKey);
    this.encryptedWallet = null;
  }

  /**
   * Check if wallet exists in storage
   */
  hasStoredWallet(): boolean {
    return localStorage.getItem(this.storageKey) !== null;
  }

  /**
   * Change wallet password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    this.ensureUnlocked();
    
    // Verify old password
    if (!this.encryptedWallet) {
      throw new Error('No encrypted wallet found');
    }
    
    try {
      await this.decryptWallet(this.encryptedWallet, oldPassword);
    } catch (error) {
      throw new Error('Invalid old password');
    }
    
    // Re-encrypt with new password
    const wallet = this.getWalletInstance();
    await this.setWallet(wallet, newPassword);
  }

  /**
   * Override parent methods to check lock status
   */
  override getAddress(): string {
    this.ensureUnlocked();
    return super.getAddress();
  }

  override getPrivateKey(): string {
    this.ensureUnlocked();
    return super.getPrivateKey();
  }

  override async getBalance(network: NetworkName, tokenAddress?: string): Promise<string> {
    this.ensureUnlocked();
    return super.getBalance(network, tokenAddress);
  }

  /**
   * Private helper methods
   */
  private async setWallet(wallet: Wallet | HDNodeWallet, password: string): Promise<void> {
    await this.createFromPrivateKey(wallet.privateKey);
    this.encryptedWallet = await this.encryptWallet(wallet, password);
    this.isLocked = false;
    
    if (this.embeddedConfig.autoSave) {
      await this.saveToStorage();
    }
  }

  private async encryptWallet(wallet: Wallet | HDNodeWallet, password: string): Promise<string> {
    try {
      return await wallet.encrypt(password);
    } catch (error) {
      throw new Error(`Failed to encrypt wallet: ${error}`);
    }
  }

  private async decryptWallet(encryptedWallet: string, password: string): Promise<Wallet | HDNodeWallet> {
    try {
      const restoredWallet = await Wallet.fromEncryptedJson(encryptedWallet, password);
      return restoredWallet;
    } catch (error) {
      throw new Error(`Failed to decrypt wallet: ${error}`);
    }
  }

  private ensureUnlocked(): void {
    if (this.isLocked) {
      throw new Error('Wallet is locked. Please unlock first.');
    }
  }

  private getWalletInstance(): Wallet | HDNodeWallet {
    // Access the private wallet property from parent class
    // This is a workaround since the wallet property is private
    const wallet = (this as any).wallet;
    if (!wallet) {
      throw new Error('Wallet not initialized');
    }
    return wallet;
  }

  /**
   * Generate a secure random mnemonic
   */
  static generateMnemonic(): string {
    return Wallet.createRandom().mnemonic?.phrase || '';
  }

  /**
   * Validate mnemonic phrase
   */
  static validateMnemonic(mnemonic: string): boolean {
    try {
      Wallet.fromPhrase(mnemonic);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate private key
   */
  static validatePrivateKey(privateKey: string): boolean {
    try {
      new Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  private setupAutoLock(_timeout: number): void {
    // Auto-lock functionality - could be enhanced with actual timer implementation
    // For now, this is a placeholder for the auto-lock feature
  }
}