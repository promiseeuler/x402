/**
 * X402 SDK - Storage Interface Type Definitions
 */

export interface X402Storage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface StorageConfig {
  prefix?: string;
  encryption?: boolean;
  compression?: boolean;
}

export interface EncryptedStorageData {
  data: string;
  iv: string;
  salt: string;
  authTag: string;
}

export interface StorageMetadata {
  version: string;
  timestamp: number;
  encrypted: boolean;
  compressed: boolean;
}