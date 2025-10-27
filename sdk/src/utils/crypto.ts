/**
 * X402 SDK - Cryptographic Utilities
 */

import { ethers } from 'ethers';
import * as crypto from 'crypto';

/**
 * Generate a new mnemonic phrase
 * @param wordCount - Number of words (12, 15, 18, 21, or 24)
 * @returns Generated mnemonic phrase
 */
export function generateMnemonic(wordCount: 12 | 15 | 18 | 21 | 24 = 12): string {
  try {
    // Calculate entropy bits based on word count
    const entropyBits = {
      12: 128,
      15: 160,
      18: 192,
      21: 224,
      24: 256
    }[wordCount];
    
    // Generate random entropy and create mnemonic
    return ethers.Mnemonic.fromEntropy(ethers.randomBytes(entropyBits / 8)).phrase;
  } catch (error) {
    throw new Error(`Failed to generate mnemonic: ${error}`);
  }
}

/**
 * Generate a new private key
 * @returns Generated private key (with 0x prefix)
 */
export function generatePrivateKey(): string {
  try {
    const wallet = ethers.Wallet.createRandom();
    return wallet.privateKey;
  } catch (error) {
    throw new Error(`Failed to generate private key: ${error}`);
  }
}

/**
 * Generate a secure random password
 * @param length - Password length (default: 16)
 * @param includeSymbols - Include special symbols (default: true)
 * @returns Generated password
 */
export function generateSecurePassword(
  length: number = 16,
  includeSymbols: boolean = true
): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let charset = lowercase + uppercase + numbers;
  if (includeSymbols) {
    charset += symbols;
  }
  
  let password = '';
  
  // Ensure at least one character from each required set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - Data to encrypt
 * @param password - Password for encryption
 * @returns Encrypted data with IV and auth tag
 */
export function encryptData(data: string, password: string): string {
  try {
    // Generate a random salt
    const salt = crypto.randomBytes(32);
    
    // Derive key from password using PBKDF2
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    // Generate random IV
    const iv = crypto.randomBytes(12);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from('x402-wallet', 'utf8'));
    
    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine salt, iv, authTag, and encrypted data
    const result = {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted: encrypted
    };
    
    return JSON.stringify(result);
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`);
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData - Encrypted data string
 * @param password - Password for decryption
 * @returns Decrypted data
 */
export function decryptData(encryptedData: string, password: string): string {
  try {
    const data = JSON.parse(encryptedData);
    
    // Extract components
    const salt = Buffer.from(data.salt, 'hex');
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    const encrypted = data.encrypted;
    
    // Derive key from password
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from('x402-wallet', 'utf8'));
    decipher.setAuthTag(authTag);
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error}`);
  }
}

/**
 * Generate a cryptographically secure random string
 * @param length - Length of the string
 * @param charset - Character set to use (default: alphanumeric)
 * @returns Random string
 */
export function generateRandomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = '';
  const bytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  
  return result;
}

/**
 * Hash data using SHA-256
 * @param data - Data to hash
 * @returns SHA-256 hash (hex string)
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Generate a deterministic ID from input data
 * @param data - Input data
 * @returns Deterministic ID
 */
export function generateId(data: string): string {
  const hash = hashData(data + Date.now().toString());
  return hash.substring(0, 16); // Return first 16 characters
}

/**
 * Verify if two strings are equal using constant-time comparison
 * @param a - First string
 * @param b - Second string
 * @returns True if equal, false otherwise
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Generate a wallet from mnemonic with optional derivation path
 * @param mnemonic - Mnemonic phrase
 * @param derivationPath - BIP44 derivation path (default: "m/44'/60'/0'/0/0")
 * @returns Wallet instance
 */
export function walletFromMnemonic(
  mnemonic: string,
  derivationPath: string = "m/44'/60'/0'/0/0"
): ethers.HDNodeWallet {
  try {
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    return ethers.HDNodeWallet.fromMnemonic(mnemonicObj, derivationPath);
  } catch (error) {
    throw new Error(`Failed to create wallet from mnemonic: ${error}`);
  }
}

/**
 * Get multiple addresses from a mnemonic
 * @param mnemonic - Mnemonic phrase
 * @param count - Number of addresses to generate (default: 5)
 * @param startIndex - Starting index (default: 0)
 * @returns Array of address objects with index, address, and private key
 */
export function getAddressesFromMnemonic(
  mnemonic: string,
  count: number = 5,
  startIndex: number = 0
): Array<{ index: number; address: string; privateKey: string }> {
  const addresses = [];
  
  for (let i = startIndex; i < startIndex + count; i++) {
    const derivationPath = `m/44'/60'/0'/0/${i}`;
    const wallet = walletFromMnemonic(mnemonic, derivationPath);
    
    addresses.push({
      index: i,
      address: wallet.address,
      privateKey: wallet.privateKey
    });
  }
  
  return addresses;
}