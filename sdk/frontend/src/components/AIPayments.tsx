/**
 * AI Payments Component
 * Handles AI service payments and transaction management
 */

import React, { useState, useEffect } from 'react';
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
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,

  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Psychology,
  Payment,
  History,
  Settings,
  Add,
  Remove,
  Refresh,
  Launch,
  CheckCircle,
  Error,
  Pending,
  Info,
  ContentCopy,
  OpenInNew,
  TrendingUp,
  AccountBalance,
  Speed,
  Security
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useWallet } from '../contexts/WalletContext';
import { OpenRouterAI, X402Protocol, EmbeddedWalletManager } from '../../../src/index';
import copy from 'copy-to-clipboard';
import toast from 'react-hot-toast';

// Types
interface AIProvider {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  costPerRequest: number;
  currency: string;
  status: 'active' | 'inactive' | 'maintenance';
  features: string[];
  logo?: string;
}

interface PaymentTransaction {
  id: string;
  providerId: string;
  providerName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  timestamp: number;
  txHash?: string;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
}

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
      id={`ai-payments-tabpanel-${index}`}
      aria-labelledby={`ai-payments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock AI Providers
const openRouterModels: AIProvider[] = [
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fast and efficient AI model for quick responses',
    baseUrl: 'https://openrouter.ai/api/v1',
    costPerRequest: 0.001,
    currency: 'STT',
    status: 'active',
    features: ['Text Generation', 'Conversation', 'Analysis', 'Writing']
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Balanced AI model for complex tasks',
    baseUrl: 'https://openrouter.ai/api/v1',
    costPerRequest: 0.0015,
    currency: 'STT',
    status: 'active',
    features: ['Advanced Reasoning', 'Code Generation', 'Research', 'Analysis']
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'OpenAI\'s efficient language model',
    baseUrl: 'https://openrouter.ai/api/v1',
    costPerRequest: 0.002,
    currency: 'STT',
    status: 'active',
    features: ['Text Generation', 'Code Completion', 'Translation', 'Summarization']
  },
  {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    description: 'OpenAI\'s most capable language model',
    baseUrl: 'https://openrouter.ai/api/v1',
    costPerRequest: 0.005,
    currency: 'STT',
    status: 'active',
    features: ['Advanced Reasoning', 'Complex Problem Solving', 'Creative Writing', 'Code Generation']
  }
];

// Validation schema
const paymentSchema = yup.object({
  providerId: yup.string().required('AI provider is required'),
  requestData: yup.string().required('Request data is required'),
  customAmount: yup.number().min(0, 'Amount must be positive').optional()
});

export const AIPayments: React.FC = () => {
  const { state } = useWallet();
  const [currentTab, setCurrentTab] = useState(0);
  const [providers] = useState<AIProvider[]>(openRouterModels);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openRouterAI, setOpenRouterAI] = useState<OpenRouterAI | null>(null);
  const [x402Protocol, setX402Protocol] = useState<X402Protocol | null>(null);
  const [paymentStats, setPaymentStats] = useState({
    totalSpent: 0,
    totalRequests: 0,
    successRate: 0,
    averageCost: 0
  });

  // Initialize services when wallet is connected
  useEffect(() => {
    if (state.isInitialized && state.address) {
      try {
        // Initialize wallet manager
        const walletManager = new EmbeddedWalletManager({
          privateKey: '',
          password: 'default-password'
        });

        // Initialize X402 protocol
        const protocol = new X402Protocol({
          walletManager,
          defaultNetwork: 'SOMNIA_TESTNET',
          spendingLimits: {
            maxPerRequest: '1',
            maxTotal: '10',
            windowSeconds: 86400,
            currentSpending: '0',
            windowStart: Date.now()
          }
        });

        // Initialize OpenRouter AI service
        const aiService = new OpenRouterAI({
          apiKey: process.env.REACT_APP_OPENROUTER_API_KEY || '',
          defaultModel: 'anthropic/claude-3-haiku'
        });

        setX402Protocol(protocol);
        setOpenRouterAI(aiService);
      } catch (error) {
        console.error('Failed to initialize AI services:', error);
        toast.error('Failed to initialize AI services');
      }
    }
  }, [state.isInitialized, state.address]);

  const paymentForm = useForm({
    resolver: yupResolver(paymentSchema),
    defaultValues: {
      providerId: '',
      requestData: '',
      customAmount: undefined
    }
  });

  useEffect(() => {
    // Calculate payment statistics
    const completedTxs = transactions.filter(tx => tx.status === 'completed');
    const totalSpent = completedTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const successRate = transactions.length > 0 ? (completedTxs.length / transactions.length) * 100 : 0;
    const averageCost = completedTxs.length > 0 ? totalSpent / completedTxs.length : 0;

    setPaymentStats({
      totalSpent,
      totalRequests: transactions.length,
      successRate,
      averageCost
    });
  }, [transactions]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleProviderSelect = (provider: AIProvider) => {
    setSelectedProvider(provider);
    paymentForm.setValue('providerId', provider.id);
    setShowPaymentDialog(true);
  };

  const handlePayment = async (data: any) => {
    if (!selectedProvider || !openRouterAI || !x402Protocol) {
      toast.error('AI service not initialized. Please connect your wallet.');
      return;
    }

    // Create transaction record
    const transaction: PaymentTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      amount: data.customAmount || selectedProvider.costPerRequest,
      currency: selectedProvider.currency,
      status: 'pending',
      timestamp: Date.now(),
      requestData: data.requestData
    };

    try {
      setIsProcessing(true);

      setTransactions(prev => [transaction, ...prev]);

      // Calculate cost for the request
       const cost = await openRouterAI.calculateCost({
         model: selectedProvider.id,
         prompt: data.requestData,
         maxTokens: 1000
       });

       // Make the paid AI request
       const response = await openRouterAI.makeRequest({
         model: selectedProvider.id,
         prompt: data.requestData,
         maxTokens: 1000
       });
      
      // Update transaction as completed
      setTransactions(prev => prev.map(tx => 
        tx.id === transaction.id 
          ? { 
              ...tx, 
              status: 'completed', 
              amount: cost.amount,
              txHash: response.transactionHash || `0x${Math.random().toString(16).substr(2, 64)}`,
              responseData: { success: true, content: response.content }
            }
          : tx
      ));
      toast.success('Payment completed successfully!');

      setShowPaymentDialog(false);
      paymentForm.reset();
      setSelectedProvider(null);
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'An error occurred during payment processing.';
      
      // Update transaction as failed
      setTransactions(prev => prev.map(tx => 
        tx.id === transaction.id 
          ? { 
              ...tx, 
              status: 'failed',
              errorMessage
            }
          : tx
      ));
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'failed': return <Error color="error" />;
      case 'pending': return <Pending color="warning" />;
      case 'cancelled': return <Error color="disabled" />;
      default: return <Info />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    copy(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
        AI Payments
      </Typography>

      {/* Payment Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">{paymentStats.totalSpent.toFixed(4)}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Spent (STT)</Typography>
                </Box>
                <AccountBalance color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">{paymentStats.totalRequests}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Requests</Typography>
                </Box>
                <TrendingUp color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">{paymentStats.successRate.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="textSecondary">Success Rate</Typography>
                </Box>
                <Speed color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">{paymentStats.averageCost.toFixed(4)}</Typography>
                  <Typography variant="body2" color="textSecondary">Avg Cost (STT)</Typography>
                </Box>
                <Payment color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="AI Providers" icon={<Psychology />} />
          <Tab label="Transaction History" icon={<History />} />
          <Tab label="Settings" icon={<Settings />} />
        </Tabs>
      </Box>

      {/* AI Providers Tab */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {providers.map((provider) => (
            <Grid item xs={12} md={6} lg={4} key={provider.id}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%',
                  cursor: provider.status === 'active' ? 'pointer' : 'default',
                  opacity: provider.status === 'active' ? 1 : 0.7,
                  '&:hover': provider.status === 'active' ? { elevation: 6 } : {}
                }}
                onClick={() => provider.status === 'active' && handleProviderSelect(provider)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {provider.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{provider.name}</Typography>
                        <Chip 
                          label={provider.status} 
                          size="small" 
                          color={getStatusColor(provider.status) as any}
                        />
                      </Box>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {provider.description}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color="primary">
                      {provider.costPerRequest} {provider.currency}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      per request
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Features:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {provider.features.map((feature, index) => (
                      <Chip 
                        key={index} 
                        label={feature} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  
                  {provider.status === 'active' && (
                    <Button 
                      variant="contained" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      startIcon={<Payment />}
                    >
                      Make Payment
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Transaction History Tab */}
      <TabPanel value={currentTab} index={1}>
        <Card elevation={3}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recent Transactions</Typography>
              <Button startIcon={<Refresh />} onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </Box>
            
            {transactions.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="textSecondary">
                  No transactions yet. Make your first AI payment to get started!
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Provider</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getStatusIcon(tx.status)}
                            <Box ml={1}>
                              <Typography variant="body2">{tx.providerName}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {tx.id.slice(0, 12)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {tx.amount.toFixed(4)} {tx.currency}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={tx.status} 
                            size="small" 
                            color={tx.status === 'completed' ? 'success' : 
                                   tx.status === 'failed' ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(tx.timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Copy Transaction ID">
                              <IconButton 
                                size="small" 
                                onClick={() => copyToClipboard(tx.id, 'Transaction ID')}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {tx.txHash && (
                              <Tooltip title="View on Explorer">
                                <IconButton size="small">
                                  <OpenInNew fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Preferences
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Configure your default payment settings for AI services.
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControl fullWidth>
                    <InputLabel>Default Currency</InputLabel>
                    <Select value="STT" label="Default Currency">
                      <MenuItem value="STT">STT (Sepolia Test Token)</MenuItem>
                      <MenuItem value="ETH">ETH (Ethereum)</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Max Amount per Transaction"
                    type="number"
                    defaultValue="1.0"
                    helperText="Maximum amount you're willing to spend per transaction"
                  />
                  
                  <TextField
                    fullWidth
                    label="Daily Spending Limit"
                    type="number"
                    defaultValue="10.0"
                    helperText="Maximum amount you're willing to spend per day"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Manage security features for AI payments.
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Require Confirmation" 
                      secondary="Always confirm before making payments"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Auto-approve Small Amounts" 
                      secondary="Automatically approve payments under 0.01 STT"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={paymentForm.handleSubmit(handlePayment)}>
          <DialogTitle>
            Make Payment to {selectedProvider?.name}
          </DialogTitle>
          <DialogContent>
            {selectedProvider && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    You're about to make a payment of {selectedProvider.costPerRequest} {selectedProvider.currency} to {selectedProvider.name}.
                  </Typography>
                </Alert>
                
                <Controller
                  name="requestData"
                  control={paymentForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      label="Request Data"
                      placeholder="Enter your AI request data (e.g., prompt, parameters)"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />
                
                <Controller
                  name="customAmount"
                  control={paymentForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Custom Amount (Optional)"
                      placeholder={selectedProvider.costPerRequest.toString()}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || `Default: ${selectedProvider.costPerRequest} ${selectedProvider.currency}`}
                      InputProps={{
                        endAdornment: selectedProvider.currency
                      }}
                    />
                  )}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isProcessing}
              startIcon={isProcessing ? <CircularProgress size={20} /> : <Payment />}
            >
              {isProcessing ? 'Processing...' : 'Make Payment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};