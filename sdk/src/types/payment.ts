/**
 * Payment-related types for X402 protocol
 */

import { NetworkName } from './network';

export interface PaymentRequest {
  /** Unique identifier for this payment request */
  id: string;
  /** Amount to pay in token units */
  amount: string;
  /** Token symbol to pay with */
  token: string;
  /** Network to use for payment */
  network: NetworkName;
  /** Recipient wallet address */
  recipient: string;
  /** Payment facilitator URL */
  facilitatorUrl: string;
  /** Optional payment description */
  description?: string;
  /** Expiration timestamp */
  expiresAt?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  /** Payment request ID */
  requestId: string;
  /** Transaction hash */
  transactionHash: string;
  /** Block number where transaction was mined */
  blockNumber?: number;
  /** Gas used for the transaction */
  gasUsed?: string;
  /** Effective gas price */
  effectiveGasPrice?: string;
  /** Payment status */
  status: PaymentStatus;
  /** Timestamp when payment was processed */
  timestamp: number;
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export interface PaymentVerification {
  /** Whether payment is verified */
  verified: boolean;
  /** Payment details if verified */
  payment?: PaymentResponse;
  /** Error message if verification failed */
  error?: string;
  /** Verification timestamp */
  verifiedAt: number;
}

export interface SpendingLimit {
  /** Maximum amount per request */
  maxPerRequest: string;
  /** Maximum total amount in time window */
  maxTotal: string;
  /** Time window in seconds */
  windowSeconds: number;
  /** Current spending in window */
  currentSpending: string;
  /** Window start timestamp */
  windowStart: number;
}

export interface PaymentHistory {
  /** Payment ID */
  id: string;
  /** Amount paid */
  amount: string;
  /** Token used */
  token: string;
  /** Network used */
  network: NetworkName;
  /** Recipient address */
  recipient: string;
  /** Transaction hash */
  transactionHash: string;
  /** Timestamp */
  timestamp: number;
  /** Service URL that was paid for */
  serviceUrl: string;
  /** Payment status */
  status: PaymentStatus;
}