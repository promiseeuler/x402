/**
 * Network Configuration Tests
 * Test suite for network configurations including Somnia testnet
 */

import {
  NETWORK_CONFIGS,
  getNetworkConfig,
  getTokenConfig,
  getSupportedNetworks,
  getSupportedTokens
} from '../src/protocol/networks';
import { NetworkName } from '../src/types';

describe('Network Configurations', () => {
  describe('Supported Networks', () => {
    it('should include Somnia testnet', () => {
      const networks = getSupportedNetworks();
      expect(networks).toContain('SOMNIA_TESTNET');
    });

    it('should include major networks', () => {
      const networks = getSupportedNetworks();
      expect(networks).toContain('ETHEREUM_MAINNET');
      expect(networks).toContain('POLYGON_MAINNET');
      expect(networks).toContain('ARBITRUM_MAINNET');
      expect(networks).toContain('BASE_MAINNET');
    });

    it('should return array of network names', () => {
      const networks = getSupportedNetworks();
      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
    });
  });

  describe('Somnia Testnet Configuration', () => {
    it('should have correct Somnia testnet configuration', () => {
      const config = getNetworkConfig('SOMNIA_TESTNET' as NetworkName);
      
      expect(config).toBeDefined();
      expect(config.name).toBe('Somnia Testnet');
      expect(config.chainId).toBe(50312);
      expect(config.rpcUrl).toBe('https://dream-rpc.somnia.network');
      expect(config.explorerUrl).toBe('https://shannon-explorer.somnia.network');
      expect(config.nativeToken.symbol).toBe('STT');
      expect(config.nativeToken.name).toBe('Somnia Testnet Token');
      expect(config.nativeToken.decimals).toBe(18);
    });

    it('should have STT token configuration', () => {
      const tokenConfig = getTokenConfig('SOMNIA_TESTNET' as NetworkName, 'STT');
      
      expect(tokenConfig).toBeDefined();
      expect(tokenConfig?.symbol).toBe('STT');
      expect(tokenConfig?.name).toBe('Somnia Testnet Token');
      expect(tokenConfig?.decimals).toBe(18);
      expect(tokenConfig?.isNative).toBe(true);
    });

    it('should be included in NETWORK_CONFIGS', () => {
      expect(NETWORK_CONFIGS['SOMNIA_TESTNET']).toBeDefined();
      expect(NETWORK_CONFIGS['SOMNIA_TESTNET'].chainId).toBe(50312);
    });

    it('should be included in token configs', () => {
      const tokenConfig = getTokenConfig('SOMNIA_TESTNET', 'STT');
      expect(tokenConfig).toBeDefined();
      expect(tokenConfig?.symbol).toBe('STT');
    });
  });

  describe('Network Configuration Validation', () => {
    it('should throw error for unsupported network', () => {
      expect(() => {
        getNetworkConfig('unsupported-network' as NetworkName);
      }).toThrow('Unsupported network: unsupported-network');
    });

    it('should have required fields for all networks', () => {
      const networks = getSupportedNetworks();
      
      networks.forEach(network => {
        const config = getNetworkConfig(network);
        expect(config).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.chainId).toBeDefined();
        expect(config.rpcUrl).toBeDefined();
        expect(config.nativeToken).toBeDefined();
        expect(config.nativeToken.symbol).toBeDefined();
        expect(config.nativeToken.name).toBeDefined();
        expect(config.nativeToken.decimals).toBeDefined();
      });
    });

    it('should have unique chain IDs', () => {
      const networks = getSupportedNetworks();
      const chainIds = networks.map(network => getNetworkConfig(network).chainId);
      const uniqueChainIds = [...new Set(chainIds)];
      
      expect(chainIds.length).toBe(uniqueChainIds.length);
    });

    it('should have valid RPC URLs', () => {
      const networks = getSupportedNetworks();
      
      networks.forEach(network => {
        const config = getNetworkConfig(network);
        expect(config.rpcUrl).toMatch(/^https?:\/\/.+/);
      });
    });
  });

  describe('Token Configurations', () => {
    it('should get supported tokens for Somnia testnet', () => {
      const tokens = getSupportedTokens();
      expect(tokens).toContain('STT');
    });

    it('should return undefined for unsupported token', () => {
      const tokenConfig = getTokenConfig('SOMNIA_TESTNET' as NetworkName, 'UNSUPPORTED');
      expect(tokenConfig).toBeUndefined();
    });

    it('should have native tokens for all networks', () => {
      const networks = getSupportedNetworks();
      
      networks.forEach(network => {
        const tokens = getSupportedTokens();
        expect(tokens.length).toBeGreaterThan(0);
        
        // Check that at least one token is native
        const hasNativeToken = tokens.some(token => {
          const config = getTokenConfig(network, token);
          return config?.isNative === true;
        });
        expect(hasNativeToken).toBe(true);
      });
    });

    it('should have consistent token configurations', () => {
      const networks = getSupportedNetworks();
      
      networks.forEach(network => {
        const networkConfig = getNetworkConfig(network);
        const nativeToken = networkConfig.nativeToken;
        
        // Test native token configuration
        const nativeConfig = getTokenConfig(network, nativeToken.symbol);
        expect(nativeConfig).toBeDefined();
        expect(nativeConfig?.symbol).toBe(nativeToken.symbol);
        expect(nativeConfig?.name).toBeDefined();
        expect(nativeConfig?.decimals).toBeGreaterThan(0);
        expect(nativeConfig?.isNative).toBe(true);
      });
    });
  });

  describe('Network Specific Tests', () => {
    it('should have correct Ethereum configuration', () => {
      const config = getNetworkConfig('ETHEREUM_MAINNET' as NetworkName);
      expect(config.chainId).toBe(1);
      expect(config.nativeToken.symbol).toBe('ETH');
    });

    it('should have correct Polygon configuration', () => {
      const config = getNetworkConfig('POLYGON_MAINNET' as NetworkName);
      expect(config.chainId).toBe(137);
      expect(config.nativeToken.symbol).toBe('MATIC');
    });

    it('should have correct Arbitrum configuration', () => {
      const config = getNetworkConfig('ARBITRUM_MAINNET' as NetworkName);
      expect(config.chainId).toBe(42161);
      expect(config.nativeToken.symbol).toBe('ETH');
    });

    it('should have correct Base configuration', () => {
      const config = getNetworkConfig('BASE_MAINNET' as NetworkName);
      expect(config.chainId).toBe(8453);
      expect(config.nativeToken.symbol).toBe('ETH');
    });
  });

  describe('Chain ID Validation', () => {
    it('should have correct Somnia testnet chain ID in hex', () => {
      const config = getNetworkConfig('SOMNIA_TESTNET' as NetworkName);
      expect(config.chainId).toBe(50312);
      expect(config.chainId.toString(16)).toBe('c488');
    });

    it('should have valid chain IDs for all networks', () => {
      const networks = getSupportedNetworks();
      
      networks.forEach(network => {
        const config = getNetworkConfig(network);
        expect(config.chainId).toBeGreaterThan(0);
        expect(Number.isInteger(config.chainId)).toBe(true);
      });
    });
  });
});