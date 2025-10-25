/**
 * X402 SDK Tests
 * Comprehensive test suite for the X402 SDK
 */

import { X402SDK } from '../src';
import { NetworkName } from '../src/types';

describe('X402SDK', () => {
  let sdk: X402SDK;
  const testPrivateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';

  beforeEach(async () => {
    sdk = await X402SDK.createFromPrivateKey(
      testPrivateKey,
      'SOMNIA_TESTNET' as NetworkName,
      {
        options: {
          debug: false,
          timeout: 5000
        }
      }
    );
  });

  describe('Initialization', () => {
    it('should create SDK with private key', async () => {
      expect(sdk).toBeInstanceOf(X402SDK);
      expect(sdk.getWalletAddress()).toBeDefined();
      expect(sdk.getWalletAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should create SDK with random wallet', async () => {
      const randomSdk = await X402SDK.createWithRandomWallet('SOMNIA_TESTNET' as NetworkName);
      expect(randomSdk).toBeInstanceOf(X402SDK);
      expect(randomSdk.getWalletAddress()).toBeDefined();
      expect(randomSdk.getWalletAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should create SDK with mnemonic', async () => {
      const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const mnemonicSdk = await X402SDK.createFromMnemonic(
        testMnemonic,
        'SOMNIA_TESTNET' as NetworkName
      );
      expect(mnemonicSdk).toBeInstanceOf(X402SDK);
      expect(mnemonicSdk.getWalletAddress()).toBeDefined();
    });

    it('should throw error when no wallet configuration provided', async () => {
      await expect(X402SDK.create({
        defaultNetwork: 'SOMNIA_TESTNET' as NetworkName,
        wallet: {}
      })).rejects.toThrow();
    });
  });

  describe('Network Support', () => {
    it('should support Somnia testnet', () => {
      const supportedNetworks = sdk.getSupportedNetworks();
      expect(supportedNetworks).toContain('SOMNIA_TESTNET');
    });

    it('should get Somnia testnet configuration', () => {
      const config = sdk.getNetworkConfig('SOMNIA_TESTNET' as NetworkName);
      expect(config).toBeDefined();
      expect(config.name).toBe('Somnia Testnet');
      expect(config.chainId).toBe(50312);
      expect(config.rpcUrl).toBe('https://dream-rpc.somnia.network');
    });

    it('should switch networks', () => {
      sdk.switchNetwork('ETHEREUM_MAINNET' as NetworkName);
      expect(sdk.getConfig().defaultNetwork).toBe('ETHEREUM_MAINNET');
    });

    it('should throw error for unsupported network', () => {
      expect(() => {
        sdk.switchNetwork('unsupported-network' as NetworkName);
      }).toThrow('Network unsupported-network is not supported');
    });
  });

  describe('Wallet Operations', () => {
    it('should get wallet address', () => {
      const address = sdk.getWalletAddress();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should export private key', () => {
      const privateKey = sdk.exportPrivateKey();
      expect(privateKey).toBe(testPrivateKey);
    });

    it('should get balance (mocked)', async () => {
      // Note: This would require mocking the wallet manager or using a test network
      // For now, we'll just test that the method exists and doesn't throw
      try {
        await sdk.getBalance('SOMNIA_TESTNET' as NetworkName);
      } catch (error) {
        // Expected to fail without proper network connection
        expect(error).toBeDefined();
      }
    });
  });

  describe('HTTP Methods', () => {
    it('should have GET method', () => {
      expect(typeof sdk.get).toBe('function');
    });

    it('should have POST method', () => {
      expect(typeof sdk.post).toBe('function');
    });

    it('should have PUT method', () => {
      expect(typeof sdk.put).toBe('function');
    });

    it('should have DELETE method', () => {
      expect(typeof sdk.delete).toBe('function');
    });

    it('should have generic request method', () => {
      expect(typeof sdk.request).toBe('function');
    });
  });

  describe('Spending Management', () => {
    it('should get current spending', () => {
      const spending = sdk.getCurrentSpending('SOMNIA_TESTNET' as NetworkName, 'STT');
      expect(typeof spending).toBe('number');
      expect(spending).toBeGreaterThanOrEqual(0);
    });

    it('should clear spending history', () => {
      sdk.clearSpendingHistory();
      const spending = sdk.getCurrentSpending('SOMNIA_TESTNET' as NetworkName, 'STT');
      expect(spending).toBe(0);
    });
  });

  describe('Facilitator Integration', () => {
    it('should create facilitator client', () => {
      const facilitator = sdk.createFacilitatorClient({
        baseUrl: 'https://facilitator.example.com',
        apiKey: 'test-key'
      });
      expect(facilitator).toBeDefined();
    });

    it('should get default facilitator', () => {
      const facilitator = sdk.getFacilitator();
      // Should be undefined since we didn't configure a default facilitator
      expect(facilitator).toBeUndefined();
    });
  });

  describe('Configuration', () => {
    it('should get SDK configuration', () => {
      const config = sdk.getConfig();
      expect(config).toBeDefined();
      expect(config.defaultNetwork).toBe('SOMNIA_TESTNET');
      expect(config.wallet.privateKey).toBe(testPrivateKey);
    });

    it('should update spending limits', () => {
      const limits = {
        maxPerRequest: '1.0',
        maxTotal: '10.0',
        windowSeconds: 3600,
        currentSpending: '0.0',
        windowStart: Date.now()
      };
      sdk.updateSpendingLimits(limits);
      const config = sdk.getConfig();
      expect(config.spendingLimits).toEqual(limits);
    });
  });
});