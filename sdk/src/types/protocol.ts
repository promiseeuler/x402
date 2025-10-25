/**
 * HTTP 402 protocol types and interfaces
 */

import { NetworkName } from './network';
import { PaymentRequest } from './payment';

/**
 * HTTP 402 Payment Required response headers
 */
export interface X402Headers {
  /** Payment facilitator URL */
  'x-payment-facilitator': string;
  /** Required payment amount */
  'x-payment-amount': string;
  /** Payment token symbol */
  'x-payment-token': string;
  /** Blockchain network */
  'x-payment-network': NetworkName;
  /** Recipient wallet address */
  'x-payment-recipient': string;
  /** Optional payment description */
  'x-payment-description'?: string;
  /** Payment expiration timestamp */
  'x-payment-expires'?: string;
  /** Unique payment request ID */
  'x-payment-id'?: string;
}

/**
 * Standard HTTP 402 response
 */
export interface X402Response {
  /** HTTP status code (402) */
  status: 402;
  /** Error message */
  message: string;
  /** Payment requirements */
  payment: PaymentRequest;
  /** Additional headers */
  headers: X402Headers;
}

/**
 * Service configuration for X402-enabled APIs
 */
export interface X402ServiceConfig {
  /** Service name */
  name: string;
  /** Service description */
  description: string;
  /** Base URL for the service */
  baseUrl: string;
  /** Payment configuration */
  payment: {
    /** Price per request */
    pricePerRequest: string;
    /** Accepted tokens */
    acceptedTokens: string[];
    /** Supported networks */
    supportedNetworks: NetworkName[];
    /** Payment facilitator URL */
    facilitatorUrl: string;
    /** Recipient wallet address */
    recipient: string;
  };
  /** Service metadata */
  metadata?: {
    /** Service category */
    category?: string;
    /** Service tags */
    tags?: string[];
    /** Rate limits */
    rateLimit?: string;
    /** Uptime SLA */
    uptime?: string;
    /** API version */
    version?: string;
  };
}

/**
 * Request configuration for X402 SDK
 */
export interface X402RequestConfig {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  data?: any;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to automatically handle 402 responses */
  autoPayment?: boolean;
  /** Maximum retries for failed payments */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

/**
 * Response from X402-enabled service
 */
export interface X402ServiceResponse<T = any> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Payment information if payment was made */
  payment?: {
    /** Payment amount */
    amount: string;
    /** Token used */
    token: string;
    /** Transaction hash */
    transactionHash: string;
    /** Network used */
    network: NetworkName;
  };
}

/**
 * Error types for X402 protocol
 */
export enum X402ErrorCode {
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INVALID_PAYMENT = 'INVALID_PAYMENT',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  UNSUPPORTED_TOKEN = 'UNSUPPORTED_TOKEN',
  UNSUPPORTED_NETWORK = 'UNSUPPORTED_NETWORK',
  FACILITATOR_ERROR = 'FACILITATOR_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export interface X402Error {
  code: X402ErrorCode;
  message: string;
  details?: any;
  paymentRequest?: PaymentRequest;
}