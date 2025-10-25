/**
 * Network configurations for X402 SDK
 * Includes all supported EVM-compatible networks
 */

import { NetworkConfig, NetworkName, TokenConfig } from '../types/network';

/**
 * Somnia Testnet Token (STT) configuration
 */
const SOMNIA_STT_TOKEN: TokenConfig = {
  symbol: 'STT',
  name: 'Somnia Testnet Token',
  decimals: 18,
  isNative: true,
  logoUrl: 'https://shannon-explorer.somnia.network/favicon.ico'
};

/**
 * Ethereum Mainnet configuration
 */
const ETHEREUM_MAINNET: NetworkConfig = {
  name: 'Ethereum Mainnet',
  chainId: 1,
  chainIdHex: '0x1',
  rpcUrl: 'https://eth.llamarpc.com',
  explorerUrl: 'https://etherscan.io',
  nativeToken: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true
  },
  supportedTokens: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      isNative: true
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0xA0b86a33E6441b8C4505E2c8C5b8b8b8b8b8b8b8',
      isNative: false
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      isNative: false
    }
  ],
  isTestnet: false
};

/**
 * Ethereum Sepolia Testnet configuration
 */
const ETHEREUM_SEPOLIA: NetworkConfig = {
  name: 'Ethereum Sepolia',
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  explorerUrl: 'https://sepolia.etherscan.io',
  nativeToken: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true
  },
  supportedTokens: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      isNative: true
    }
  ],
  isTestnet: true
};

/**
 * Base Mainnet configuration
 */
const BASE_MAINNET: NetworkConfig = {
  name: 'Base Mainnet',
  chainId: 8453,
  chainIdHex: '0x2105',
  rpcUrl: 'https://mainnet.base.org',
  explorerUrl: 'https://basescan.org',
  nativeToken: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true
  },
  supportedTokens: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      isNative: true
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      isNative: false
    }
  ],
  isTestnet: false
};

/**
 * Base Sepolia Testnet configuration
 */
const BASE_SEPOLIA: NetworkConfig = {
  name: 'Base Sepolia',
  chainId: 84532,
  chainIdHex: '0x14a34',
  rpcUrl: 'https://sepolia.base.org',
  explorerUrl: 'https://sepolia.basescan.org',
  nativeToken: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true
  },
  supportedTokens: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      isNative: true
    }
  ],
  isTestnet: true
};

/**
 * Somnia Testnet configuration
 */
const SOMNIA_TESTNET: NetworkConfig = {
  name: 'Somnia Testnet',
  chainId: 50312,
  chainIdHex: '0xc488',
  rpcUrl: 'https://dream-rpc.somnia.network',
  explorerUrl: 'https://shannon-explorer.somnia.network',
  nativeToken: SOMNIA_STT_TOKEN,
  supportedTokens: [SOMNIA_STT_TOKEN],
  isTestnet: true
};

/**
 * Polygon Mainnet configuration
 */
const POLYGON_MAINNET: NetworkConfig = {
  name: 'Polygon Mainnet',
  chainId: 137,
  chainIdHex: '0x89',
  rpcUrl: 'https://polygon-rpc.com',
  explorerUrl: 'https://polygonscan.com',
  nativeToken: {
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    isNative: true
  },
  supportedTokens: [
    {
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      isNative: true
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      isNative: false
    }
  ],
  isTestnet: false
};

/**
 * Arbitrum Mainnet configuration
 */
const ARBITRUM_MAINNET: NetworkConfig = {
  name: 'Arbitrum One',
  chainId: 42161,
  chainIdHex: '0xa4b1',
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  explorerUrl: 'https://arbiscan.io',
  nativeToken: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true
  },
  supportedTokens: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      isNative: true
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      isNative: false
    }
  ],
  isTestnet: false
};

/**
 * Network configurations mapping
 */
export const NETWORK_CONFIGS: Record<NetworkName, NetworkConfig> = {
  ETHEREUM_MAINNET,
  ETHEREUM_SEPOLIA,
  BASE_MAINNET,
  BASE_SEPOLIA,
  SOMNIA_TESTNET,
  POLYGON_MAINNET,
  ARBITRUM_MAINNET
};

/**
 * Get network configuration by name
 */
export function getNetworkConfig(networkName: NetworkName): NetworkConfig {
  const config = NETWORK_CONFIGS[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}`);
  }
  return config;
}

/**
 * Get network configuration by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORK_CONFIGS).find(config => config.chainId === chainId);
}

/**
 * Get all supported networks
 */
export function getSupportedNetworks(): NetworkName[] {
  return Object.keys(NETWORK_CONFIGS) as NetworkName[];
}

/**
 * Get testnet networks only
 */
export function getTestnetNetworks(): NetworkName[] {
  return Object.entries(NETWORK_CONFIGS)
    .filter(([, config]) => config.isTestnet)
    .map(([name]) => name as NetworkName);
}

/**
 * Get mainnet networks only
 */
export function getMainnetNetworks(): NetworkName[] {
  return Object.entries(NETWORK_CONFIGS)
    .filter(([, config]) => !config.isTestnet)
    .map(([name]) => name as NetworkName);
}

/**
 * Check if a token is supported on a network
 */
export function isTokenSupported(networkName: NetworkName, tokenSymbol: string): boolean {
  const config = getNetworkConfig(networkName);
  return config.supportedTokens.some(token => token.symbol === tokenSymbol);
}

/**
 * Get token configuration for a network
 */
export function getTokenConfig(networkName: NetworkName, tokenSymbol: string): TokenConfig | undefined {
  const config = getNetworkConfig(networkName);
  return config.supportedTokens.find(token => token.symbol === tokenSymbol);
}

/**
 * Get all supported tokens across all networks
 */
export function getSupportedTokens(): string[] {
  const tokens = new Set<string>();
  Object.values(NETWORK_CONFIGS).forEach(config => {
    config.supportedTokens.forEach(token => {
      tokens.add(token.symbol);
    });
  });
  return Array.from(tokens);
}