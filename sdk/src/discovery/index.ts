/**
 * X402 Discovery Layer
 * 
 * Provides service discovery capabilities for finding X402-enabled APIs and services.
 * Includes both centralized registry lookup and decentralized discovery methods.
 */

export { 
  X402Bazaar, 
  createDiscoveryClient, 
  discoverServices, 
  checkX402Support 
} from './bazaar.js';

// Re-export discovery-related types
export type {
  ServiceInfo,
  DiscoveryConfig
} from '../types/index.js';

/**
 * Default discovery configuration for Somnia ecosystem
 */
export const SOMNIA_DISCOVERY_CONFIG = {
  registryUrl: 'https://registry.x402.org',
  cacheTimeout: 300000, // 5 minutes
  maxResults: 50,
  timeout: 10000,
  enableCache: true
};

/**
 * Popular service categories in the X402 ecosystem
 */
export const SERVICE_CATEGORIES = {
  AI: 'ai',
  DATA: 'data', 
  API: 'api',
  CONTENT: 'content',
  COMPUTE: 'compute',
  STORAGE: 'storage',
  ANALYTICS: 'analytics',
  MEDIA: 'media',
  GAMING: 'gaming',
  DEFI: 'defi'
} as const;

/**
 * Common pricing models used by X402 services
 */
export const PRICING_MODELS = {
  PER_REQUEST: 'per-request',
  PER_MINUTE: 'per-minute',
  PER_MB: 'per-mb',
  PER_COMPUTATION: 'per-computation',
  SUBSCRIPTION: 'subscription',
  TIERED: 'tiered'
} as const;

/**
 * Utility functions for working with discovered services
 */
export const DiscoveryUtils = {
  /**
   * Filter services by price range
   */
  filterByPrice: (services: any[], minPrice?: number, maxPrice?: number) => {
    return services.filter(service => {
      const price = parseFloat(service.pricing?.amount || '0');
      if (minPrice !== undefined && price < minPrice) return false;
      if (maxPrice !== undefined && price > maxPrice) return false;
      return true;
    });
  },

  /**
   * Sort services by popularity (usage count)
   */
  sortByPopularity: (services: any[]) => {
    return [...services].sort((a, b) => {
      const usageA = a.metadata?.usage || 0;
      const usageB = b.metadata?.usage || 0;
      return usageB - usageA;
    });
  },

  /**
   * Sort services by price (ascending)
   */
  sortByPrice: (services: any[]) => {
    return [...services].sort((a, b) => {
      const priceA = parseFloat(a.pricing?.amount || '0');
      const priceB = parseFloat(b.pricing?.amount || '0');
      return priceA - priceB;
    });
  },

  /**
   * Filter services by network support
   */
  filterByNetwork: (services: any[], network: string) => {
    return services.filter(service => {
      const networks = service.supportedNetworks || [];
      return networks.includes(network) || networks.includes('all');
    });
  },

  /**
   * Get unique categories from a list of services
   */
  getUniqueCategories: (services: any[]) => {
    const categories = services
      .map(service => service.category)
      .filter(Boolean);
    return [...new Set(categories)];
  },

  /**
   * Calculate average price for a category
   */
  getAveragePrice: (services: any[]) => {
    if (services.length === 0) return 0;
    
    const prices = services
      .map(service => parseFloat(service.pricing?.amount || '0'))
      .filter(price => price > 0);
    
    if (prices.length === 0) return 0;
    
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }
};

/**
 * Create a discovery client configured for Somnia Testnet
 */
export function createSomniaDiscoveryClient() {
  return createDiscoveryClient(SOMNIA_DISCOVERY_CONFIG);
}