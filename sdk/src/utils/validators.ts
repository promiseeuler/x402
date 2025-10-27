/**
 * X402 SDK - Validation Utilities
 */

import { ethers } from 'ethers';

/**
 * Validate an Ethereum address
 * @param address - Address to validate
 * @returns True if valid, false otherwise
 */
export function validateAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validate a private key
 * @param privateKey - Private key to validate (with or without 0x prefix)
 * @returns True if valid, false otherwise
 */
export function validatePrivateKey(privateKey: string): boolean {
  try {
    // Remove 0x prefix if present
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    
    // Check if it's a valid hex string of correct length (64 characters)
    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      return false;
    }
    
    // Try to create a wallet from the private key
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a mnemonic phrase
 * @param mnemonic - Mnemonic phrase to validate
 * @returns True if valid, false otherwise
 */
export function validateMnemonic(mnemonic: string): boolean {
  try {
    return ethers.Mnemonic.isValidMnemonic(mnemonic.trim());
  } catch {
    return false;
  }
}

/**
 * Validate a password strength
 * @param password - Password to validate
 * @param minLength - Minimum length (default: 8)
 * @returns Object with validation result and requirements
 */
export function validatePassword(
  password: string,
  minLength: number = 8
): {
  isValid: boolean;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
  score: number; // 0-5
} {
  const requirements = {
    length: password.length >= minLength,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  const isValid = score >= 4; // Require at least 4 out of 5 criteria
  
  return {
    isValid,
    requirements,
    score
  };
}

/**
 * Validate an amount string
 * @param amount - Amount to validate
 * @param maxDecimals - Maximum decimal places (default: 18)
 * @returns True if valid, false otherwise
 */
export function validateAmount(amount: string, maxDecimals: number = 18): boolean {
  try {
    if (!amount || amount.trim() === '') return false;
    
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return false;
    
    // Check decimal places
    const decimalPart = amount.split('.')[1];
    if (decimalPart && decimalPart.length > maxDecimals) {
      return false;
    }
    
    // Try to parse as bigint
    ethers.parseUnits(amount, maxDecimals);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a URL
 * @param url - URL to validate
 * @param allowedProtocols - Allowed protocols (default: ['http:', 'https:'])
 * @returns True if valid, false otherwise
 */
export function validateUrl(
  url: string,
  allowedProtocols: string[] = ['http:', 'https:']
): boolean {
  try {
    const urlObj = new URL(url);
    return allowedProtocols.includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate a transaction hash
 * @param txHash - Transaction hash to validate
 * @returns True if valid, false otherwise
 */
export function validateTxHash(txHash: string): boolean {
  try {
    // Remove 0x prefix if present
    const cleanHash = txHash.startsWith('0x') ? txHash.slice(2) : txHash;
    
    // Check if it's a valid hex string of correct length (64 characters)
    return /^[0-9a-fA-F]{64}$/.test(cleanHash);
  } catch {
    return false;
  }
}

/**
 * Validate a network configuration
 * @param network - Network config to validate
 * @returns True if valid, false otherwise
 */
export function validateNetworkConfig(network: any): boolean {
  try {
    return !!(
      network &&
      typeof network.name === 'string' &&
      typeof network.chainId === 'number' &&
      network.chainId > 0 &&
      typeof network.rpcUrl === 'string' &&
      validateUrl(network.rpcUrl) &&
      typeof network.currency === 'string'
    );
  } catch {
    return false;
  }
}

/**
 * Validate an email address
 * @param email - Email to validate
 * @returns True if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a JSON string
 * @param jsonString - JSON string to validate
 * @returns True if valid, false otherwise
 */
export function validateJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a hex string
 * @param hex - Hex string to validate (with or without 0x prefix)
 * @param expectedLength - Expected length in bytes (optional)
 * @returns True if valid, false otherwise
 */
export function validateHex(hex: string, expectedLength?: number): boolean {
  try {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    
    if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
      return false;
    }
    
    if (expectedLength !== undefined) {
      return cleanHex.length === expectedLength * 2; // 2 hex chars per byte
    }
    
    return cleanHex.length % 2 === 0; // Must be even length
  } catch {
    return false;
  }
}