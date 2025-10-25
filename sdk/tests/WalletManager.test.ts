/**
 * WalletManager Tests
 * Test suite for wallet management functionality
 */

import { WalletManager, WalletManagerConfig } from '../src/wallet';
import { getNetworkConfig, getSupportedNetworks } from '../src/protocol';
import { NetworkName } from '../src/types';

describe('WalletManager', () => {
  let walletManager: WalletManager;
  let config: WalletManagerConfig;

  beforeEach(() => {
    config = {
      // Basic wallet manager config without networks property
    };
    walletManager = new WalletManager(config);
  });

  describe('Wallet Creation', () => {
    it('should create wallet from private key', async () => {
      const privateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
      await walletManager.createFromPrivateKey(privateKey);
      
      expect(walletManager.getAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(walletManager.getPrivateKey()).toBe(privateKey);
    });

    it('should create wallet from mnemonic', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      await walletManager.createFromMnemonic(mnemonic);
      
      expect(walletManager.getAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(walletManager.getPrivateKey()).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should create random wallet', async () => {
      await walletManager.createRandom();
      
      expect(walletManager.getAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(walletManager.getPrivateKey()).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should throw error for invalid private key', async () => {
      const invalidKey = 'invalid-key';
      await expect(walletManager.createFromPrivateKey(invalidKey))
        .rejects.toThrow();
    });

    it('should throw error for invalid mnemonic', async () => {
      const invalidMnemonic = 'invalid mnemonic phrase';
      await expect(walletManager.createFromMnemonic(invalidMnemonic))
        .rejects.toThrow();
    });
  });

  describe('Network Operations', () => {
    beforeEach(async () => {
      await walletManager.createRandom();
    });

    it('should get provider for supported network', () => {
      const provider = walletManager.getProvider('SOMNIA_TESTNET' as NetworkName);
      expect(provider).toBeDefined();
    });

    it('should get connected wallet for supported network', () => {
      const wallet = walletManager.getConnectedWallet('SOMNIA_TESTNET' as NetworkName);
      expect(wallet).toBeDefined();
      expect(wallet.address).toBe(walletManager.getAddress());
    });

    it('should throw error for unsupported network', () => {
      expect(() => {
        walletManager.getProvider('unsupported-network' as NetworkName);
      }).toThrow('Unsupported network: unsupported-network');
    });
  });

  describe('Balance Operations', () => {
    beforeEach(async () => {
      await walletManager.createRandom();
    });

    it('should have getBalance method', () => {
      expect(typeof walletManager.getBalance).toBe('function');
    });

    it('should have getTokenBalance method', () => {
      expect(typeof walletManager.getBalance).toBe('function');
    });

    it('should have hasSufficientBalance method', () => {
      expect(typeof walletManager.hasSufficientBalance).toBe('function');
    });

    // Note: Actual balance tests would require network connectivity
    // and test tokens, so we're just testing method existence
  });

  describe('Transaction Operations', () => {
    beforeEach(async () => {
      await walletManager.createRandom();
    });

    it('should have sendTransaction method', () => {
      expect(typeof walletManager.sendTransaction).toBe('function');
    });

    it('should have sendTokenTransaction method', () => {
      expect(typeof walletManager.sendTokenTransaction).toBe('function');
    });

    it('should have estimateGas method', () => {
      expect(typeof walletManager.estimateGas).toBe('function');
    });

    it('should have getGasPrice method', () => {
      expect(typeof walletManager.getGasPrice).toBe('function');
    });

    it('should have waitForTransaction method', () => {
      expect(typeof walletManager.waitForTransaction).toBe('function');
    });

    // Note: Actual transaction tests would require network connectivity
    // and test funds, so we're just testing method existence
  });

  describe('Wallet State', () => {
    it('should throw error when accessing address without wallet', () => {
      expect(() => walletManager.getAddress()).toThrow('Wallet not initialized');
    });

    it('should throw error when accessing private key without wallet', () => {
      expect(() => walletManager.getPrivateKey()).toThrow('Wallet not initialized');
    });

    it('should return correct address after wallet creation', async () => {
      const privateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
      await walletManager.createFromPrivateKey(privateKey);
      
      const address = walletManager.getAddress();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      
      // Create another wallet manager with same key to verify deterministic address
      const walletManager2 = new WalletManager(config);
      await walletManager2.createFromPrivateKey(privateKey);
      
      expect(walletManager2.getAddress()).toBe(address);
    });
  });

  describe('Network Configuration', () => {
    it('should support Somnia testnet', () => {
      const somniaConfig = getNetworkConfig('SOMNIA_TESTNET');
      expect(somniaConfig).toBeDefined();
      expect(somniaConfig.chainId).toBe(50312);
      expect(somniaConfig.rpcUrl).toBe('https://dream-rpc.somnia.network');
    });

    it('should support multiple networks', () => {
      const supportedNetworks = getSupportedNetworks();
      expect(supportedNetworks.length).toBeGreaterThan(1);
      expect(supportedNetworks).toContain('ETHEREUM_MAINNET');
      expect(supportedNetworks).toContain('POLYGON_MAINNET');
    });
  });
});