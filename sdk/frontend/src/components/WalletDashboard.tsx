/**
 * Professional Wallet Dashboard Component
 * Main interface for X402 wallet management
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import {
  AccountBalanceWallet,
  Lock,
  LockOpen,
  Refresh,
  ContentCopy,
  QrCode,
  Settings,
  Backup,
  Download,
  Upload,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';
import { WalletSetup } from './WalletSetup';
import { WalletSecurity } from './WalletSecurity';
import { AIPayments } from './AIPayments';
import { NetworkSelector } from './NetworkSelector';
import { QRCodeModal } from './QRCodeModal';
import { NetworkName } from '../../../src/types/network';
import copy from 'copy-to-clipboard';
import toast from 'react-hot-toast';

export const WalletDashboard: React.FC = () => {
  const { state, lock, refreshBalance } = useWallet();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'payments'>('overview');
  const [currentNetwork, setCurrentNetwork] = useState<NetworkName>('ETHEREUM_MAINNET');

  // Show setup screen if wallet is not initialized or no stored wallet
  if (!state.isInitialized || (!state.hasStoredWallet && state.isLocked)) {
    return <WalletSetup />;
  }

  // Show unlock screen if wallet is locked
  if (state.isLocked) {
    return <WalletSetup />;
  }

  const handleCopyAddress = () => {
    if (state.address) {
      copy(state.address);
      toast.success('Address copied to clipboard');
    }
  };

  const handleRefreshBalance = async () => {
    try {
      await refreshBalance();
      toast.success('Balance refreshed');
    } catch (error) {
      toast.error('Failed to refresh balance');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string | null) => {
    if (!balance) return '0.00';
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <AccountBalanceWallet sx={{ fontSize: 40, color: 'white' }} />
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                X402 Wallet
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Professional AI Payment Wallet
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <NetworkSelector 
              currentNetwork={currentNetwork}
              onNetworkChange={setCurrentNetwork}
            />
            <Tooltip title="Lock Wallet">
              <IconButton onClick={lock} sx={{ color: 'white' }}>
                <Lock />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {state.error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
          {state.error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant={activeTab === 'overview' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('overview')}
          sx={{ mr: 1 }}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'security' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('security')}
          sx={{ mr: 1 }}
        >
          Security
        </Button>
        <Button
          variant={activeTab === 'payments' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('payments')}
        >
          AI Payments
        </Button>
      </Box>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Grid container spacing={3}>
          {/* Wallet Info Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" gutterBottom>
                    Wallet Information
                  </Typography>
                  <Chip 
                    icon={<LockOpen />} 
                    label="Unlocked" 
                    color="success" 
                    size="small" 
                  />
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Address
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {state.address ? formatAddress(state.address) : 'N/A'}
                    </Typography>
                    <Tooltip title="Copy Address">
                      <IconButton size="small" onClick={handleCopyAddress}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Show QR Code">
                      <IconButton size="small" onClick={() => setShowQRCode(true)}>
                        <QrCode fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Network
                  </Typography>
                  <Chip label={state.network} size="small" variant="outlined" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Balance Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" gutterBottom>
                    Balance
                  </Typography>
                  <Tooltip title="Refresh Balance">
                    <IconButton 
                      onClick={handleRefreshBalance} 
                      disabled={state.isLoading}
                      size="small"
                    >
                      {state.isLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Refresh fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {formatBalance(state.balance)} STT
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Somnia Testnet Tokens
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Backup />}
                      onClick={() => setActiveTab('security')}
                    >
                      Backup Wallet
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Settings />}
                      onClick={() => setActiveTab('security')}
                    >
                      Security Settings
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => setActiveTab('payments')}
                    >
                      AI Payments
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<QrCode />}
                      onClick={() => setShowQRCode(true)}
                    >
                      Show QR Code
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && <WalletSecurity />}

      {/* AI Payments Tab */}
      {activeTab === 'payments' && <AIPayments />}

      {/* QR Code Modal */}
      <QRCodeModal
        open={showQRCode}
        onClose={() => setShowQRCode(false)}
        title="Wallet Address"
        data={state.address || ''}
        description="Scan this QR code to get the wallet address"
      />
    </Box>
  );
};