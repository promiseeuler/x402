/**
 * Wallet Context Provider for X402 Frontend
 * Manages embedded wallet state and operations
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { EmbeddedWalletManager, WalletBackup } from '../../../src/wallet/EmbeddedWalletManager';
import { X402SDK } from '../../../src/sdk/X402SDK';
import { NetworkName } from '../../../src/types/network';
import toast from 'react-hot-toast';

export interface WalletState {
  isInitialized: boolean;
  isLocked: boolean;
  address: string | null;
  balance: string | null;
  network: NetworkName;
  isLoading: boolean;
  error: string | null;
  hasStoredWallet: boolean;
}

export interface WalletContextType {
  state: WalletState;
  walletManager: EmbeddedWalletManager | null;
  sdk: X402SDK | null;
  
  // Wallet operations
  createWallet: (password: string) => Promise<{ mnemonic: string; address: string }>;
  importFromMnemonic: (mnemonic: string, password: string) => Promise<void>;
  importFromPrivateKey: (privateKey: string, password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  
  // Recovery operations
  exportMnemonic: () => Promise<string>;
  exportPrivateKey: () => Promise<string>;
  createBackup: (password: string) => Promise<WalletBackup>;
  restoreFromBackup: (backup: WalletBackup, password: string) => Promise<void>;
  
  // Utility operations
  refreshBalance: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  clearWallet: () => Promise<void>;
  switchNetwork: (network: NetworkName) => Promise<void>;
}

type WalletAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_LOCKED'; payload: boolean }
  | { type: 'SET_ADDRESS'; payload: string | null }
  | { type: 'SET_BALANCE'; payload: string | null }
  | { type: 'SET_NETWORK'; payload: NetworkName }
  | { type: 'SET_HAS_STORED_WALLET'; payload: boolean }
  | { type: 'RESET_STATE' };

const initialState: WalletState = {
  isInitialized: false,
  isLocked: true,
  address: null,
  balance: null,
  network: 'SOMNIA_TESTNET',
  isLoading: false,
  error: null,
  hasStoredWallet: false
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_LOCKED':
      return { ...state, isLocked: action.payload };
    case 'SET_ADDRESS':
      return { ...state, address: action.payload };
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_NETWORK':
      return { ...state, network: action.payload };
    case 'SET_HAS_STORED_WALLET':
      return { ...state, hasStoredWallet: action.payload };
    case 'RESET_STATE':
      return { ...initialState, network: state.network };
    default:
      return state;
  }
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
  defaultNetwork?: NetworkName;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ 
  children, 
  defaultNetwork = 'SOMNIA_TESTNET' 
}) => {
  const [state, dispatch] = useReducer(walletReducer, {
    ...initialState,
    network: defaultNetwork
  });
  
  const [walletManager, setWalletManager] = React.useState<EmbeddedWalletManager | null>(null);
  const [sdk, setSdk] = React.useState<X402SDK | null>(null);

  // Initialize wallet manager on mount
  useEffect(() => {
    const initializeWalletManager = async () => {
      try {
        const manager = new EmbeddedWalletManager({
          password: '', // Will be set when wallet is created/unlocked
          autoSave: true,
          storagePrefix: 'x402_embedded',
          customRpcUrls: {}
        });
        
        setWalletManager(manager);
        dispatch({ type: 'SET_HAS_STORED_WALLET', payload: manager.hasStoredWallet() });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: `Failed to initialize wallet manager: ${error}` });
      }
    };

    initializeWalletManager();
  }, []);

  // Initialize SDK when wallet is unlocked
  useEffect(() => {
    if (walletManager && !state.isLocked && state.address) {
      const initializeSDK = async () => {
        try {
          const newSdk = new X402SDK({
            defaultNetwork: state.network,
            wallet: {
              privateKey: walletManager.getPrivateKey()
            },
            facilitator: {
              baseUrl: 'http://localhost:3003'
            }
          });
          
          await newSdk.initializeWallet();
          setSdk(newSdk);
        } catch (error) {
          console.error('Failed to initialize SDK:', error);
        }
      };

      initializeSDK();
    } else {
      setSdk(null);
    }
  }, [walletManager, state.isLocked, state.address, state.network]);

  const createWallet = async (password: string): Promise<{ mnemonic: string; address: string }> => {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const result = await walletManager.createSecureWallet(password);
      dispatch({ type: 'SET_ADDRESS', payload: result.address });
      dispatch({ type: 'SET_LOCKED', payload: false });
      dispatch({ type: 'SET_HAS_STORED_WALLET', payload: true });
      
      toast.success('Wallet created successfully!');
      await refreshBalance();
      
      return result;
    } catch (error) {
      const errorMessage = `Failed to create wallet: ${error}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const importFromMnemonic = async (mnemonic: string, password: string): Promise<void> => {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const address = await walletManager.importFromMnemonic(mnemonic, password);
      dispatch({ type: 'SET_ADDRESS', payload: address });
      dispatch({ type: 'SET_LOCKED', payload: false });
      dispatch({ type: 'SET_HAS_STORED_WALLET', payload: true });
      
      toast.success('Wallet imported successfully!');
      await refreshBalance();
    } catch (error) {
      const errorMessage = `Failed to import wallet: ${error}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const importFromPrivateKey = async (privateKey: string, password: string): Promise<void> => {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const address = await walletManager.importFromPrivateKey(privateKey, password);
      dispatch({ type: 'SET_ADDRESS', payload: address });
      dispatch({ type: 'SET_LOCKED', payload: false });
      dispatch({ type: 'SET_HAS_STORED_WALLET', payload: true });
      
      toast.success('Wallet imported successfully!');
      await refreshBalance();
    } catch (error) {
      const errorMessage = `Failed to import wallet: ${error}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const unlock = async (password: string): Promise<void> => {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      await walletManager.unlock(password);
      const address = walletManager.getAddress();
      dispatch({ type: 'SET_ADDRESS', payload: address });
      dispatch({ type: 'SET_LOCKED', payload: false });
      
      toast.success('Wallet unlocked successfully!');
      await refreshBalance();
    } catch (error) {
      const errorMessage = `Failed to unlock wallet: ${error}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const lock = (): void => {
    if (!walletManager) return;
    
    walletManager.lock();
    dispatch({ type: 'SET_LOCKED', payload: true });
    dispatch({ type: 'SET_ADDRESS', payload: null });
    dispatch({ type: 'SET_BALANCE', payload: null });
    setSdk(null);
    
    toast.success('Wallet locked');
  };

  const exportMnemonic = async (): Promise<string> => {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    return await walletManager.exportMnemonic();
  };

  const exportPrivateKey = async (): Promise<string> => {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    return await walletManager.exportPrivateKey();
  };

  const createBackup = async (password: string): Promise<WalletBackup> => {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    return await walletManager.createBackup(password);
  };

  const restoreFromBackup = async (backup: WalletBackup, password: string): Promise<void> => {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const address = await walletManager.restoreFromBackup(backup, password);
      dispatch({ type: 'SET_ADDRESS', payload: address });
      dispatch({ type: 'SET_LOCKED', payload: false });
      dispatch({ type: 'SET_HAS_STORED_WALLET', payload: true });
      
      toast.success('Wallet restored from backup!');
      await refreshBalance();
    } catch (error) {
      const errorMessage = `Failed to restore wallet: ${error}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshBalance = async (): Promise<void> => {
    if (!walletManager || state.isLocked) return;
    
    try {
      const balance = await walletManager.getBalance(state.network);
      dispatch({ type: 'SET_BALANCE', payload: balance });
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    if (!walletManager) throw new Error('Wallet manager not initialized');
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await walletManager.changePassword(oldPassword, newPassword);
      toast.success('Password changed successfully!');
    } catch (error) {
      const errorMessage = `Failed to change password: ${error}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearWallet = async (): Promise<void> => {
    if (!walletManager) return;
    
    await walletManager.clearStorage();
    dispatch({ type: 'RESET_STATE' });
    setSdk(null);
    
    toast.success('Wallet cleared');
  };

  const switchNetwork = async (network: NetworkName): Promise<void> => {
    dispatch({ type: 'SET_NETWORK', payload: network });
    await refreshBalance();
    toast.success(`Switched to ${network}`);
  };

  const contextValue: WalletContextType = {
    state,
    walletManager,
    sdk,
    createWallet,
    importFromMnemonic,
    importFromPrivateKey,
    unlock,
    lock,
    exportMnemonic,
    exportPrivateKey,
    createBackup,
    restoreFromBackup,
    refreshBalance,
    changePassword,
    clearWallet,
    switchNetwork
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};