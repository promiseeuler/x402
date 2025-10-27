/**
 * X402 SDK - Utility Functions for Formatting
 */

import { ethers } from 'ethers';

/**
 * Format a balance from wei to a human-readable string
 * @param balance - Balance in wei (string or BigNumber)
 * @param decimals - Token decimals (default: 18 for ETH)
 * @param precision - Number of decimal places to show (default: 4)
 * @returns Formatted balance string
 */
export function formatBalance(
  balance: string | ethers.BigNumber,
  decimals: number = 18,
  precision: number = 4
): string {
  try {
    const balanceBN = ethers.BigNumber.from(balance);
    const formatted = ethers.utils.formatUnits(balanceBN, decimals);
    const num = parseFloat(formatted);
    
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    
    return num.toFixed(precision).replace(/\.?0+$/, '');
  } catch (error) {
    console.error('Error formatting balance:', error);
    return '0';
  }
}

/**
 * Parse a human-readable balance string to wei
 * @param balance - Human-readable balance string
 * @param decimals - Token decimals (default: 18 for ETH)
 * @returns Balance in wei as BigNumber
 */
export function parseBalance(
  balance: string,
  decimals: number = 18
): ethers.BigNumber {
  try {
    return ethers.utils.parseUnits(balance, decimals);
  } catch (error) {
    throw new Error(`Invalid balance format: ${balance}`);
  }
}

/**
 * Format an address for display (truncate middle)
 * @param address - Ethereum address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Formatted address string
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a transaction hash for display
 * @param txHash - Transaction hash
 * @param length - Number of characters to show (default: 10)
 * @returns Formatted transaction hash
 */
export function formatTxHash(txHash: string, length: number = 10): string {
  if (!txHash || txHash.length <= length) {
    return txHash;
  }
  
  return `${txHash.slice(0, length)}...`;
}

/**
 * Format a timestamp to a readable date string
 * @param timestamp - Unix timestamp or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  timestamp: number | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
  return date.toLocaleDateString(undefined, options);
}

/**
 * Format a number with appropriate suffixes (K, M, B)
 * @param num - Number to format
 * @param precision - Decimal places (default: 1)
 * @returns Formatted number string
 */
export function formatNumber(num: number, precision: number = 1): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(precision) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(precision) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(precision) + 'K';
  }
  return num.toFixed(precision);
}

/**
 * Format a percentage value
 * @param value - Decimal value (0.1 = 10%)
 * @param precision - Decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, precision: number = 2): string {
  return `${(value * 100).toFixed(precision)}%`;
}

/**
 * Format currency with symbol
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: 'ETH')
 * @param precision - Decimal places (default: 4)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: string | number,
  currency: string = 'ETH',
  precision: number = 4
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = num.toFixed(precision).replace(/\.?0+$/, '');
  return `${formatted} ${currency}`;
}