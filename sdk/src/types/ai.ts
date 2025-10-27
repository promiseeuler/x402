/**
 * X402 SDK - AI Provider Type Definitions
 */

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  costPerRequest: number;
  currency: string;
  status: 'active' | 'inactive' | 'maintenance';
  features: string[];
  authentication?: {
    type: 'api_key' | 'bearer' | 'custom';
    headerName?: string;
  };
}

export interface AIPaymentRequest {
  providerId: string;
  requestData: any;
  customAmount?: number;
  metadata?: Record<string, any>;
}

export interface AIPaymentResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  response?: any;
  error?: string;
}

export interface AITransaction {
  id: string;
  providerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  txHash?: string;
  error?: string;
}

export interface AIPaymentStats {
  totalSpent: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageAmount: number;
  currency: string;
}