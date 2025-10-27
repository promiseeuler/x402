/**
 * Wallet Setup Component
 * Handles wallet creation, import, and unlock operations
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
  IconButton,
  InputAdornment,
  Grid,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AccountBalanceWallet,
  Security,
  Download,
  Upload,
  Lock,
  ContentCopy
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useWallet } from '../contexts/WalletContext';
import { EmbeddedWalletManager } from '../../../src/wallet/EmbeddedWalletManager';
import copy from 'copy-to-clipboard';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wallet-tabpanel-${index}`}
      aria-labelledby={`wallet-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Validation schemas
const createWalletSchema = yup.object({
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required')
});

const importMnemonicSchema = yup.object({
  mnemonic: yup.string().required('Mnemonic phrase is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

const importPrivateKeySchema = yup.object({
  privateKey: yup.string().required('Private key is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

const unlockSchema = yup.object({
  password: yup.string().required('Password is required')
});

export const WalletSetup: React.FC = () => {
  const { state, createWallet, importFromMnemonic, importFromPrivateKey, unlock } = useWallet();
  const [tabValue, setTabValue] = useState(state.hasStoredWallet ? 3 : 0); // Show unlock tab if wallet exists
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createdMnemonic, setCreatedMnemonic] = useState<string>('');
  const [createdAddress, setCreatedAddress] = useState<string>('');
  const [createStep, setCreateStep] = useState(0);

  // Form configurations
  const createForm = useForm({
    resolver: yupResolver(createWalletSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const importMnemonicForm = useForm({
    resolver: yupResolver(importMnemonicSchema),
    defaultValues: { mnemonic: '', password: '' }
  });

  const importPrivateKeyForm = useForm({
    resolver: yupResolver(importPrivateKeySchema),
    defaultValues: { privateKey: '', password: '' }
  });

  const unlockForm = useForm({
    resolver: yupResolver(unlockSchema),
    defaultValues: { password: '' }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateWallet = async (data: { password: string; confirmPassword: string }) => {
    try {
      const result = await createWallet(data.password);
      setCreatedMnemonic(result.mnemonic);
      setCreatedAddress(result.address);
      setCreateStep(1);
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  const handleImportMnemonic = async (data: { mnemonic: string; password: string }) => {
    try {
      // Validate mnemonic first
      if (!EmbeddedWalletManager.validateMnemonic(data.mnemonic.trim())) {
        toast.error('Invalid mnemonic phrase');
        return;
      }
      await importFromMnemonic(data.mnemonic.trim(), data.password);
    } catch (error) {
      console.error('Failed to import from mnemonic:', error);
    }
  };

  const handleImportPrivateKey = async (data: { privateKey: string; password: string }) => {
    try {
      // Validate private key first
      if (!EmbeddedWalletManager.validatePrivateKey(data.privateKey.trim())) {
        toast.error('Invalid private key');
        return;
      }
      await importFromPrivateKey(data.privateKey.trim(), data.password);
    } catch (error) {
      console.error('Failed to import from private key:', error);
    }
  };

  const handleUnlock = async (data: { password: string }) => {
    try {
      await unlock(data.password);
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
    }
  };

  const handleCopyMnemonic = () => {
    copy(createdMnemonic);
    toast.success('Mnemonic copied to clipboard');
  };

  const handleFinishSetup = () => {
    setCreateStep(0);
    setCreatedMnemonic('');
    setCreatedAddress('');
  };

  const generateRandomMnemonic = () => {
    const mnemonic = EmbeddedWalletManager.generateMnemonic();
    importMnemonicForm.setValue('mnemonic', mnemonic);
  };

  if (!state.isInitialized) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <AccountBalanceWallet sx={{ fontSize: 60, color: 'white', mb: 2 }} />
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
          X402 Wallet Setup
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Secure AI Payment Wallet
        </Typography>
      </Paper>

      {/* Error Alert */}
      {state.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {state.error}
        </Alert>
      )}

      <Card elevation={3}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Create Wallet" icon={<AccountBalanceWallet />} disabled={state.hasStoredWallet} />
            <Tab label="Import Mnemonic" icon={<Download />} disabled={state.hasStoredWallet} />
            <Tab label="Import Private Key" icon={<Upload />} disabled={state.hasStoredWallet} />
            <Tab label="Unlock Wallet" icon={<Lock />} disabled={!state.hasStoredWallet} />
          </Tabs>
        </Box>

        {/* Create Wallet Tab */}
        <TabPanel value={tabValue} index={0}>
          {createStep === 0 ? (
            <form onSubmit={createForm.handleSubmit(handleCreateWallet)}>
              <Typography variant="h6" gutterBottom>
                Create New Wallet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Create a new secure wallet with a strong password. Your wallet will be encrypted and stored locally.
              </Typography>

              <Controller
                name="password"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    sx={{ mb: 2 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />

              <Controller
                name="confirmPassword"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    sx={{ mb: 3 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={state.isLoading}
                startIcon={state.isLoading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
              >
                {state.isLoading ? 'Creating Wallet...' : 'Create Wallet'}
              </Button>
            </form>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom color="success.main">
                ✅ Wallet Created Successfully!
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  ⚠️ Important: Save your recovery phrase
                </Typography>
                <Typography variant="body2">
                  Write down these 12 words in order and store them safely. This is the only way to recover your wallet if you forget your password.
                </Typography>
              </Alert>

              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Recovery Phrase</Typography>
                  <IconButton size="small" onClick={handleCopyMnemonic}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {createdMnemonic}
                </Typography>
              </Paper>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">Wallet Address:</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {createdAddress}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={handleFinishSetup}
                size="large"
              >
                I've Saved My Recovery Phrase
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Import Mnemonic Tab */}
        <TabPanel value={tabValue} index={1}>
          <form onSubmit={importMnemonicForm.handleSubmit(handleImportMnemonic)}>
            <Typography variant="h6" gutterBottom>
              Import from Mnemonic
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Enter your 12-word recovery phrase to restore your wallet.
            </Typography>

            <Box display="flex" gap={1} mb={2}>
              <Button
                variant="outlined"
                size="small"
                onClick={generateRandomMnemonic}
              >
                Generate Random
              </Button>
            </Box>

            <Controller
              name="mnemonic"
              control={importMnemonicForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Recovery Phrase (12 words)"
                  placeholder="word1 word2 word3 ..."
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              name="password"
              control={importMnemonicForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="New Password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 3 }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={state.isLoading}
              startIcon={state.isLoading ? <CircularProgress size={20} /> : <Download />}
            >
              {state.isLoading ? 'Importing...' : 'Import Wallet'}
            </Button>
          </form>
        </TabPanel>

        {/* Import Private Key Tab */}
        <TabPanel value={tabValue} index={2}>
          <form onSubmit={importPrivateKeyForm.handleSubmit(handleImportPrivateKey)}>
            <Typography variant="h6" gutterBottom>
              Import from Private Key
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Enter your private key to restore your wallet.
            </Typography>

            <Controller
              name="privateKey"
              control={importPrivateKeyForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="Private Key"
                  placeholder="0x..."
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              name="password"
              control={importPrivateKeyForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="New Password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 3 }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={state.isLoading}
              startIcon={state.isLoading ? <CircularProgress size={20} /> : <Upload />}
            >
              {state.isLoading ? 'Importing...' : 'Import Wallet'}
            </Button>
          </form>
        </TabPanel>

        {/* Unlock Wallet Tab */}
        <TabPanel value={tabValue} index={3}>
          <form onSubmit={unlockForm.handleSubmit(handleUnlock)}>
            <Typography variant="h6" gutterBottom>
              Unlock Wallet
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Enter your password to unlock your wallet.
            </Typography>

            <Controller
              name="password"
              control={unlockForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="Password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 3 }}
                  autoFocus
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={state.isLoading}
              startIcon={state.isLoading ? <CircularProgress size={20} /> : <Lock />}
            >
              {state.isLoading ? 'Unlocking...' : 'Unlock Wallet'}
            </Button>
          </form>
        </TabPanel>
      </Card>
    </Box>
  );
};