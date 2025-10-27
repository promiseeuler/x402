/**
 * Facilitator Communication Module
 * Exports facilitator client and related types for payment verification
 */

export { FacilitatorClient } from './FacilitatorClient';
export { AIFacilitator } from './AIFacilitator';
export type {
  FacilitatorConfig,
  PaymentQuote,
  PaymentProof,
  ServiceAccess,
  FacilitatorError
} from './FacilitatorClient';
export type {
  AIFacilitatorConfig,
  AIServiceRequest,
  AIServiceResponse,
  PaymentVerification
} from './AIFacilitator';