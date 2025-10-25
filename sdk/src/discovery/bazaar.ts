import axios from 'axios';
import { ServiceInfo, DiscoveryConfig, X402Error, X402ErrorCode } from '../types/index.js';

/**
 * X402 Service Discovery - Bazaar
 * 
 * Helps developers discover X402-enabled services and APIs.
 * Supports both centralized registries and decentralized discovery methods.
 */
export class X402Bazaar {
  private config: DiscoveryConfig;
  private serviceCache: Map<string, ServiceInfo[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  constructor(config: Partial<DiscoveryConfig> = {}) {
    this.config = {
      registryUrl: config.registryUrl || 'https://registry.x402.org',
      cacheTimeout: config.cacheTimeout || 300000,
      maxResults: config.maxResults || 50,
      timeout: config.timeout || 5000,
      enableCache: config.enableCache !== false
    };
  }

  /**
   * Discover X402-enabled services by category
   * @param category - Service category (e.g., 'ai', 'data', 'api', 'content')
   * @param options - Search options
   * @returns List of discovered services
   */
  async discoverByCategory(
    category: string,
    options: {
      network?: string;
      priceRange?: { min?: number; max?: number };
      limit?: number;
    } = {}
  ): Promise<ServiceInfo[]> {
    const cacheKey = `category:${category}:${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.config.enableCache && this.isCacheValid(cacheKey)) {
      return this.serviceCache.get(cacheKey) || [];
    }

    try {
      const params = new URLSearchParams({
        category,
        limit: (options?.limit || this.config.maxResults).toString()
      });

      if (options.network) {
        params.append('network', options.network);
      }
      if (options.priceRange?.min !== undefined) {
        params.append('minPrice', options.priceRange.min.toString());
      }
      if (options.priceRange?.max !== undefined) {
        params.append('maxPrice', options.priceRange.max.toString());
      }

      const response = await axios.get(
        `${this.config.registryUrl}/services/category?${params}`,
        { timeout: this.config.timeout || 5000 }
      );

      const services = this.parseServiceResponse(response.data);
      
      // Cache results
      if (this.config.enableCache) {
        this.cacheResults(cacheKey, services);
      }

      return services;
    } catch (error) {
      throw new X402Error(
        `Failed to discover services by category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.DISCOVERY_ERROR
      );
    }
  }

  /**
   * Search for X402-enabled services by keywords
   * @param query - Search query
   * @param options - Search options
   * @returns List of matching services
   */
  async search(
    query: string,
    options: {
      network?: string;
      category?: string;
      priceRange?: { min?: number; max?: number };
      limit?: number;
    } = {}
  ): Promise<ServiceInfo[]> {
    const cacheKey = `search:${query}:${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.config.enableCache && this.isCacheValid(cacheKey)) {
      return this.serviceCache.get(cacheKey) || [];
    }

    try {
      const params = new URLSearchParams({
        q: query,
        limit: (options.limit || this.config.maxResults).toString()
      });

      if (options.network) {
        params.append('network', options.network);
      }
      if (options.category) {
        params.append('category', options.category);
      }
      if (options.priceRange?.min !== undefined) {
        params.append('minPrice', options.priceRange.min.toString());
      }
      if (options.priceRange?.max !== undefined) {
        params.append('maxPrice', options.priceRange.max.toString());
      }

      const response = await axios.get(
        `${this.config.registryUrl}/services/search?${params}`,
        { timeout: this.config.timeout }
      );

      const services = this.parseServiceResponse(response.data);
      
      // Cache results
      if (this.config.enableCache) {
        this.cacheResults(cacheKey, services);
      }

      return services;
    } catch (error) {
      throw new X402Error(
        `Failed to search services: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.DISCOVERY_ERROR
      );
    }
  }

  /**
   * Get detailed information about a specific service
   * @param serviceId - Unique service identifier
   * @returns Detailed service information
   */
  async getServiceDetails(serviceId: string): Promise<ServiceInfo> {
    const cacheKey = `service:${serviceId}`;
    
    // Check cache first
    if (this.config.enableCache && this.isCacheValid(cacheKey)) {
      const cached = this.serviceCache.get(cacheKey);
      if (cached && cached.length > 0) {
        return cached[0];
      }
    }

    try {
      const response = await axios.get(
        `${this.config.registryUrl}/services/${serviceId}`,
        { timeout: this.config.timeout }
      );

      const service = this.parseServiceInfo(response.data);
      
      // Cache result
      if (this.config.enableCache) {
        this.cacheResults(cacheKey, [service]);
      }

      return service;
    } catch (error) {
      throw new X402Error(
        `Failed to get service details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.DISCOVERY_ERROR
      );
    }
  }

  /**
   * Check if a URL supports X402 payments
   * @param url - URL to check
   * @returns X402 support information
   */
  async checkX402Support(url: string): Promise<{
    supported: boolean;
    endpoints?: string[];
    paymentMethods?: string[];
    networks?: string[];
  }> {
    try {
      // Try to make a HEAD request to check for X402 headers
      const response = await axios.head(url, {
        timeout: this.config.timeout,
        validateStatus: () => true // Don't throw on any status
      });

      const supported = response.headers['x-payment-required'] === 'true' ||
                       response.headers['x-accepts-payment'] === 'true' ||
                       response.status === 402;

      if (!supported) {
        return { supported: false };
      }

      // Extract payment information from headers
      const endpoints = response.headers['x-payment-endpoints']?.split(',').map((s: string) => s.trim()) || [];
      const paymentMethods = response.headers['x-payment-methods']?.split(',').map((s: string) => s.trim()) || [];
      const networks = response.headers['x-supported-networks']?.split(',').map((s: string) => s.trim()) || [];

      return {
        supported: true,
        endpoints,
        paymentMethods,
        networks
      };
    } catch (error) {
      return { supported: false };
    }
  }

  /**
   * Get popular X402 services
   * @param options - Filter options
   * @returns List of popular services
   */
  async getPopularServices(options: {
    network?: string;
    category?: string;
    limit?: number;
  } = {}): Promise<ServiceInfo[]> {
    const cacheKey = `popular:${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.config.enableCache && this.isCacheValid(cacheKey)) {
      return this.serviceCache.get(cacheKey) || [];
    }

    try {
      const params = new URLSearchParams({
        limit: (options.limit || this.config.maxResults).toString()
      });

      if (options.network) {
        params.append('network', options.network);
      }
      if (options.category) {
        params.append('category', options.category);
      }

      const response = await axios.get(
        `${this.config.registryUrl}/services/popular?${params}`,
        { timeout: this.config.timeout }
      );

      const services = this.parseServiceResponse(response.data);
      
      // Cache results
      if (this.config.enableCache) {
        this.cacheResults(cacheKey, services);
      }

      return services;
    } catch (error) {
      throw new X402Error(
        `Failed to get popular services: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.DISCOVERY_ERROR
      );
    }
  }

  /**
   * Get available service categories
   * @returns List of available categories
   */
  async getCategories(): Promise<string[]> {
    const cacheKey = 'categories';
    
    // Check cache first
    if (this.config.enableCache && this.isCacheValid(cacheKey)) {
      const cached = this.serviceCache.get(cacheKey);
      if (cached) {
        return cached.map(s => s.category).filter(Boolean) as string[];
      }
    }

    try {
      const response = await axios.get(
        `${this.config.registryUrl}/categories`,
        { timeout: this.config.timeout }
      );

      const categories = Array.isArray(response.data) ? response.data : response.data.categories || [];
      
      // Cache results (store as fake services for caching)
      if (this.config.enableCache) {
        const fakeServices = categories.map((cat: string) => ({ category: cat } as ServiceInfo));
        this.cacheResults(cacheKey, fakeServices);
      }

      return categories;
    } catch (error) {
      throw new X402Error(
        `Failed to get categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.DISCOVERY_ERROR
      );
    }
  }

  /**
   * Clear discovery cache
   */
  clearCache(): void {
    this.serviceCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Update discovery configuration
   * @param updates - Configuration updates
   */
  updateConfig(updates: Partial<DiscoveryConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Clear cache if caching was disabled
    if (updates.enableCache === false) {
      this.clearCache();
    }
  }

  // Private helper methods

  private parseServiceResponse(data: any): ServiceInfo[] {
    if (!data) return [];
    
    const services = Array.isArray(data) ? data : data.services || [];
    return services.map((service: any) => this.parseServiceInfo(service));
  }

  private parseServiceInfo(data: any): ServiceInfo {
    return {
      id: data.id || data.serviceId,
      name: data.name,
      description: data.description,
      url: data.url || data.endpoint,
      category: data.category,
      pricing: {
        model: data.pricing?.model || data.pricingModel || 'per-request',
        amount: data.pricing?.amount || data.price || '0',
        currency: data.pricing?.currency || data.currency || 'ETH',
        network: data.pricing?.network || data.network || 'ethereum'
      },
      metadata: {
        version: data.version || '1.0',
        author: data.author || data.provider,
        tags: data.tags || [],
        rating: data.rating,
        usage: data.usage || data.usageCount || 0,
        lastUpdated: data.lastUpdated || data.updatedAt
      },
      endpoints: data.endpoints || [],
      supportedNetworks: data.supportedNetworks || data.networks || [],
      paymentMethods: data.paymentMethods || ['native', 'erc20']
    };
  }

  private isCacheValid(key: string): boolean {
    if (!this.config.enableCache) return false;
    
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    
    return Date.now() < expiry;
  }

  private cacheResults(key: string, services: ServiceInfo[]): void {
    if (!this.config.enableCache) return;
    
    this.serviceCache.set(key, services);
    this.cacheExpiry.set(key, Date.now() + this.config.cacheTimeout);
  }
}

/**
 * Create a discovery client with default configuration
 * @param config - Optional configuration overrides
 * @returns X402Bazaar instance
 */
export function createDiscoveryClient(config: Partial<DiscoveryConfig> = {}): X402Bazaar {
  return new X402Bazaar(config);
}

/**
 * Quick discovery function for finding services by category
 * @param category - Service category
 * @param network - Target network (optional)
 * @returns Promise of discovered services
 */
export async function discoverServices(
  category: string,
  network?: string
): Promise<ServiceInfo[]> {
  const bazaar = createDiscoveryClient();
  return await bazaar.discoverByCategory(category, { network });
}

/**
 * Quick function to check if a URL supports X402
 * @param url - URL to check
 * @returns Promise of X402 support information
 */
export async function checkX402Support(url: string) {
  const bazaar = createDiscoveryClient();
  return await bazaar.checkX402Support(url);
}