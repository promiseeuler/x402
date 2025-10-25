import { PaymentRequiredResponse, PaymentRequirement, X402Error, X402ErrorCode } from '../types/index.js';

/**
 * Parses HTTP 402 Payment Required responses according to X402 protocol specification
 * Based on the official X402 protocol: https://github.com/coinbase/x402
 */
export class X402Parser {
  /**
   * Parse a 402 Payment Required response
   * @param response - HTTP Response object or response data
   * @returns Parsed payment requirements
   */
  static async parse402(response: Response | any): Promise<PaymentRequiredResponse> {
    try {
      // Handle different response types
      let responseData: any;
      let headers: Headers | Record<string, string>;

      if (response instanceof Response) {
        if (response.status !== 402) {
          throw new X402Error(
            `Expected 402 status code, got ${response.status}`,
            X402ErrorCode.INVALID_PAYMENT_RESPONSE
          );
        }
        responseData = await response.json();
        headers = response.headers;
      } else {
        // Handle axios response or plain object
        responseData = response.data || response;
        headers = response.headers || {};
      }

      // Validate required fields
      if (!responseData.accepts || !Array.isArray(responseData.accepts)) {
        throw new X402Error(
          'Invalid payment response: missing or invalid accepts array',
          X402ErrorCode.INVALID_PAYMENT_RESPONSE
        );
      }

      // Parse and validate payment requirements
      const accepts: PaymentRequirement[] = responseData.accepts.map((req: any) => {
        return this.validatePaymentRequirement(req);
      });

      return {
        x402Version: responseData.x402Version || 1,
        accepts,
        message: responseData.message || 'Payment Required'
      };
    } catch (error) {
      if (error instanceof X402Error) {
        throw error;
      }
      throw new X402Error(
        `Failed to parse 402 response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        X402ErrorCode.INVALID_PAYMENT_RESPONSE,
        error
      );
    }
  }

  /**
   * Extract payment metadata from headers (legacy support)
   * @param headers - HTTP headers
   * @returns Payment requirement or null
   */
  static extractFromHeaders(headers: Headers | Record<string, string>): PaymentRequirement | null {
    const getHeader = (name: string): string | null => {
      if (headers instanceof Headers) {
        return headers.get(name);
      }
      return headers[name] || headers[name.toLowerCase()] || null;
    };

    const amount = getHeader('x-402-amount') || getHeader('x402-amount');
    const token = getHeader('x-402-token') || getHeader('x402-token');
    const payTo = getHeader('x-402-payto') || getHeader('x402-payto');
    const network = getHeader('x-402-network') || getHeader('x402-network');

    if (!amount || !token || !payTo) {
      return null;
    }

    return {
      scheme: 'exact',
      network: network || 'ethereum',
      token,
      amount,
      payTo,
      nonce: getHeader('x-402-nonce') || getHeader('x402-nonce') || undefined,
      expiry: this.parseExpiry(getHeader('x-402-expiry') || getHeader('x402-expiry'))
    };
  }

  /**
   * Validate a payment requirement object
   * @param req - Payment requirement to validate
   * @returns Validated payment requirement
   */
  private static validatePaymentRequirement(req: any): PaymentRequirement {
    const required = ['scheme', 'network', 'token', 'amount', 'payTo'];
    const missing = required.filter(field => !req[field]);
    
    if (missing.length > 0) {
      throw new X402Error(
        `Invalid payment requirement: missing fields ${missing.join(', ')}`,
        X402ErrorCode.INVALID_PAYMENT_RESPONSE
      );
    }

    // Validate amount is a valid number string
    if (isNaN(parseFloat(req.amount))) {
      throw new X402Error(
        `Invalid payment amount: ${req.amount}`,
        X402ErrorCode.INVALID_PAYMENT_RESPONSE
      );
    }

    // Validate Ethereum address format for payTo
    if (req.network === 'ethereum' || req.network === 'somnia') {
      if (!/^0x[a-fA-F0-9]{40}$/.test(req.payTo)) {
        throw new X402Error(
          `Invalid Ethereum address: ${req.payTo}`,
          X402ErrorCode.INVALID_PAYMENT_RESPONSE
        );
      }
    }

    return {
      scheme: req.scheme,
      network: req.network,
      token: req.token,
      amount: req.amount,
      payTo: req.payTo,
      nonce: req.nonce,
      expiry: req.expiry,
      extras: req.extras
    };
  }

  /**
   * Parse expiry timestamp
   * @param expiry - Expiry string or number
   * @returns Expiry timestamp or undefined
   */
  private static parseExpiry(expiry: string | null): number | undefined {
    if (!expiry) return undefined;
    
    const timestamp = parseInt(expiry, 10);
    if (isNaN(timestamp)) return undefined;
    
    return timestamp;
  }

  /**
   * Check if a payment requirement has expired
   * @param requirement - Payment requirement to check
   * @returns True if expired, false otherwise
   */
  static isExpired(requirement: PaymentRequirement): boolean {
    if (!requirement.expiry) return false;
    return Date.now() > requirement.expiry * 1000;
  }

  /**
   * Select the best payment requirement from available options
   * @param requirements - Array of payment requirements
   * @param preferredNetwork - Preferred network (optional)
   * @returns Best payment requirement or null
   */
  static selectBestRequirement(
    requirements: PaymentRequirement[],
    preferredNetwork?: string
  ): PaymentRequirement | null {
    if (requirements.length === 0) return null;

    // Filter out expired requirements
    const validRequirements = requirements.filter(req => !this.isExpired(req));
    if (validRequirements.length === 0) return null;

    // Prefer exact scheme
    const exactRequirements = validRequirements.filter(req => req.scheme === 'exact');
    const candidates = exactRequirements.length > 0 ? exactRequirements : validRequirements;

    // Prefer specified network
    if (preferredNetwork) {
      const networkMatch = candidates.find(req => req.network === preferredNetwork);
      if (networkMatch) return networkMatch;
    }

    // Return the first valid requirement
    return candidates[0];
  }
}