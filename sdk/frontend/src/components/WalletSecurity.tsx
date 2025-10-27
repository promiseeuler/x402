/**
 * Wallet Security Component
 * Handles backup, recovery, and security operations
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  InputAdornment,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  Security,
  Backup,
  Restore,
  Key,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Download,
  Upload,
  Warning,
  CheckCircle,
  Lock,
  Delete
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useWallet } from '../contexts/WalletContext';
import { WalletBackup } from '../../../src/wallet/EmbeddedWalletManager';
import copy from 'copy-to-clipboard';
import toast from 'react-hot-toast';

// Validation schemas
const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required('Confirm password is required')
});

const backupPasswordSchema = yup.object({
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

const restoreBackupSchema = yup.object({
  backupData: yup.string().required('Backup data is required'),
  password: yup.string().required('Password is required')
});

export const WalletSecurity: React.FC = () => {
  const { 
    state, 
    exportMnemonic, 
    exportPrivateKey, 
    createBackup, 
    restoreFromBackup, 
    changePassword,
    clearWallet
  } = useWallet();
  
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [backupData, setBackupData] = useState<WalletBackup | null>(null);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showClearWalletDialog, setShowClearWalletDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form configurations
  const changePasswordForm = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  const backupPasswordForm = useForm({
    resolver: yupResolver(backupPasswordSchema),
    defaultValues: { password: '' }
  });

  const restoreBackupForm = useForm({
    resolver: yupResolver(restoreBackupSchema),
    defaultValues: { backupData: '', password: '' }
  });

  const handleExportMnemonic = async () => {
    try {
      setIsLoading(true);
      const mnemonicPhrase = await exportMnemonic();
      setMnemonic(mnemonicPhrase);
      setShowMnemonic(true);
    } catch (error) {
      toast.error(`Failed to export mnemonic: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPrivateKey = async () => {
    try {
      setIsLoading(true);
      const key = await exportPrivateKey();
      setPrivateKey(key);
      setShowPrivateKey(true);
    } catch (error) {
      toast.error(`Failed to export private key: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async (data: { password: string }) => {
    try {
      setIsLoading(true);
      const backup = await createBackup(data.password);
      setBackupData(backup);
      toast.success('Backup created successfully!');
    } catch (error) {
      toast.error(`Failed to create backup: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (data: { backupData: string; password: string }) => {
    try {
      setIsLoading(true);
      const backup = JSON.parse(data.backupData) as WalletBackup;
      await restoreFromBackup(backup, data.password);
      setShowRestoreDialog(false);
      restoreBackupForm.reset();
    } catch (error) {
      toast.error(`Failed to restore backup: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      setIsLoading(true);
      await changePassword(data.currentPassword, data.newPassword);
      setShowChangePasswordDialog(false);
      changePasswordForm.reset();
    } catch (error) {
      toast.error(`Failed to change password: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearWallet = async () => {
    try {
      await clearWallet();
      setShowClearWalletDialog(false);
    } catch (error) {
      toast.error(`Failed to clear wallet: ${error}`);
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    copy(text);
    toast.success(`${label} copied to clipboard`);
  };

  const downloadBackup = () => {
    if (!backupData) return;
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `x402-wallet-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Backup file downloaded');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
        Wallet Security
      </Typography>

      <Grid container spacing={3}>
        {/* Export Options */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Wallet Data
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Export your wallet's recovery phrase or private key for backup purposes.
              </Typography>

              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  ⚠️ Never share your recovery phrase or private key with anyone. Store them securely offline.
                </Typography>
              </Alert>

              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={isLoading ? <CircularProgress size={20} /> : <Key />}
                  onClick={handleExportMnemonic}
                  disabled={isLoading}
                  fullWidth
                >
                  Export Recovery Phrase
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={isLoading ? <CircularProgress size={20} /> : <Key />}
                  onClick={handleExportPrivateKey}
                  disabled={isLoading}
                  fullWidth
                >
                  Export Private Key
                </Button>
              </Box>

              {/* Mnemonic Display */}
              {showMnemonic && mnemonic && (
                <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">Recovery Phrase</Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyToClipboard(mnemonic, 'Recovery phrase')}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {mnemonic}
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => setShowMnemonic(false)}
                    sx={{ mt: 1 }}
                  >
                    Hide
                  </Button>
                </Paper>
              )}

              {/* Private Key Display */}
              {showPrivateKey && privateKey && (
                <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">Private Key</Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyToClipboard(privateKey, 'Private key')}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {privateKey}
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => setShowPrivateKey(false)}
                    sx={{ mt: 1 }}
                  >
                    Hide
                  </Button>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Backup & Restore */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup & Restore
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Create encrypted backups of your wallet or restore from existing backups.
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<Backup />}
                  onClick={() => setShowBackupDialog(true)}
                  fullWidth
                >
                  Create Backup
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Restore />}
                  onClick={() => setShowRestoreDialog(true)}
                  fullWidth
                >
                  Restore from Backup
                </Button>
              </Box>

              {/* Backup Data Display */}
              {backupData && (
                <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'success.50' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" color="success.main">
                      <CheckCircle fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Backup Created
                    </Typography>
                    <Button size="small" onClick={downloadBackup} startIcon={<Download />}>
                      Download
                    </Button>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Address: {backupData.address.slice(0, 10)}...
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Created: {new Date(backupData.timestamp).toLocaleString()}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    startIcon={<Lock />}
                    onClick={() => setShowChangePasswordDialog(true)}
                    fullWidth
                  >
                    Change Password
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setShowClearWalletDialog(true)}
                    fullWidth
                  >
                    Clear Wallet
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Backup Dialog */}
      <Dialog open={showBackupDialog} onClose={() => setShowBackupDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={backupPasswordForm.handleSubmit(handleCreateBackup)}>
          <DialogTitle>Create Encrypted Backup</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Enter a password to encrypt your wallet backup. This password will be required to restore the backup.
            </Typography>
            
            <Controller
              name="password"
              control={backupPasswordForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="Backup Password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mt: 1 }}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBackupDialog(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Backup />}
            >
              Create Backup
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={showRestoreDialog} onClose={() => setShowRestoreDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={restoreBackupForm.handleSubmit(handleRestoreBackup)}>
          <DialogTitle>Restore from Backup</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Paste your backup data and enter the password used to create the backup.
            </Typography>
            
            <Controller
              name="backupData"
              control={restoreBackupForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label="Backup Data (JSON)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />
            
            <Controller
              name="password"
              control={restoreBackupForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="Backup Password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRestoreDialog(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Restore />}
            >
              Restore Wallet
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onClose={() => setShowChangePasswordDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={changePasswordForm.handleSubmit(handleChangePassword)}>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <Controller
              name="currentPassword"
              control={changePasswordForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="Current Password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 2, mt: 1 }}
                />
              )}
            />
            
            <Controller
              name="newPassword"
              control={changePasswordForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="New Password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />
            
            <Controller
              name="confirmPassword"
              control={changePasswordForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowChangePasswordDialog(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Lock />}
            >
              Change Password
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Clear Wallet Dialog */}
      <Dialog open={showClearWalletDialog} onClose={() => setShowClearWalletDialog(false)}>
        <DialogTitle>Clear Wallet</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              ⚠️ This will permanently delete your wallet from this device. Make sure you have backed up your recovery phrase or private key.
            </Typography>
          </Alert>
          <Typography variant="body2">
            Are you sure you want to clear your wallet? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearWalletDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleClearWallet}
            color="error" 
            variant="contained"
            startIcon={<Delete />}
          >
            Clear Wallet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};