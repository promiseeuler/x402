/**
 * Facilitator Configuration
 * Easily configurable pricing and facilitator settings
 */

export interface FacilitatorConfig {
  baseUrl: string;
  facilitatorFeePercentage: number;
  pricePerRequest: Record<string, number>;
}

// Helper function to safely get environment variables
const getEnvVar = (key: string, defaultValue: string): string => {
  // In React, environment variables are available via process.env even in browser
  // Vite/Create React App injects them at build time
  return process.env[key] || defaultValue;
};

export const facilitatorConfig: FacilitatorConfig = {
  // Facilitator server URL
  baseUrl: getEnvVar('REACT_APP_FACILITATOR_URL', 'http://localhost:3001'),
  
  // Facilitator fee as a percentage (0.1 = 10%)
  facilitatorFeePercentage: parseFloat(getEnvVar('REACT_APP_FACILITATOR_FEE', '0.1')),
  
  // Price per request for each AI model (in STT tokens)
  pricePerRequest: {
    'anthropic/claude-3-haiku': parseFloat(getEnvVar('REACT_APP_PRICE_CLAUDE_HAIKU', '0.001')),
    'anthropic/claude-3-sonnet': parseFloat(getEnvVar('REACT_APP_PRICE_CLAUDE_SONNET', '0.0015')),
    'openai/gpt-3.5-turbo': parseFloat(getEnvVar('REACT_APP_PRICE_GPT35', '0.002')),
    'openai/gpt-4': parseFloat(getEnvVar('REACT_APP_PRICE_GPT4', '0.005'))
  }
};



// Helper function to get total cost including facilitator fee
export const calculateTotalCost = (baseCost: number): number => {
  return baseCost + (baseCost * facilitatorConfig.facilitatorFeePercentage);
};

// Helper function to get facilitator fee amount
export const getFacilitatorFee = (baseCost: number): number => {
  return baseCost * facilitatorConfig.facilitatorFeePercentage;
};