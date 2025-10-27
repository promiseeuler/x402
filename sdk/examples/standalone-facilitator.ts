import * as express from 'express';
import * as cors from 'cors';
import { X402SDK } from '../src/sdk/X402SDK';

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Global variables
let sdk: X402SDK;

// In-memory storage for demo purposes
interface ServiceRegistration {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  pricing: {
    amount: string;
    currency: string;
  };
  owner: string;
  registeredAt: number;
  lastUpdated: number;
  status: 'active' | 'inactive';
}

interface PaymentRecord {
  id: string;
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  serviceId?: string;
}

const registeredServices: Map<string, ServiceRegistration> = new Map();
const paymentRecords: Map<string, PaymentRecord> = new Map();

// Initialize the facilitator
async function initializeFacilitator() {
  try {
    console.log('🚀 Initializing X402 Facilitator...');
    
    // Initialize SDK
    sdk = new X402SDK({
      defaultNetwork: 'SOMNIA_TESTNET',
      wallet: {
        createRandom: true
      },
      spendingLimits: {
        maxPerRequest: '10.0',
        maxTotal: '1000.0',
        windowSeconds: 3600,
        currentSpending: '0.0',
        windowStart: Date.now()
      },
      facilitator: {
        baseUrl: 'http://localhost:3003'
      }
    });
    
    await sdk.initializeWallet();
    
    const address = sdk.getWalletAddress();
    const balance = await sdk.getBalance('SOMNIA_TESTNET');
    
    console.log('✅ Facilitator initialized successfully!');
    console.log(`📍 Facilitator Address: ${address}`);
    console.log(`💰 Facilitator Balance: ${balance} STT`);
    
    
    // Register some demo services
    await registerDemoServices();
    
  } catch (error) {
    console.error('❌ Failed to initialize facilitator:', error);
    process.exit(1);
  }
}

// Register demo services
async function registerDemoServices() {
  const demoServices: Omit<ServiceRegistration, 'id' | 'registeredAt' | 'lastUpdated'>[] = [
    {
      name: 'Basic Data API',
      description: 'Simple data retrieval service',
      endpoint: 'http://localhost:3001/api/data',
      pricing: { amount: '0.001', currency: 'STT' },
      owner: sdk.getWalletAddress(),
      status: 'active'
    },
    {
      name: 'Premium Data API',
      description: 'Advanced data with premium features',
      endpoint: 'http://localhost:3001/api/premium-data',
      pricing: { amount: '0.005', currency: 'STT' },
      owner: sdk.getWalletAddress(),
      status: 'active'
    }
  ];
  
  for (const service of demoServices) {
    const id = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    registeredServices.set(id, {
      ...service,
      id,
      registeredAt: Date.now(),
      lastUpdated: Date.now()
    });
  }
  
  console.log(`📋 Registered ${demoServices.length} demo services`);
}

// Service Discovery Routes

// Register a new service
app.post('/services/register', async (req, res) => {
  try {
    const { name, description, endpoint, pricing, owner } = req.body;
    
    if (!name || !description || !endpoint || !pricing || !owner) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, endpoint, pricing, owner'
      });
    }
    
    const id = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const service: ServiceRegistration = {
      id,
      name,
      description,
      endpoint,
      pricing,
      owner,
      registeredAt: Date.now(),
      lastUpdated: Date.now(),
      status: 'active'
    };
    
    registeredServices.set(id, service);
    
    console.log(`📝 Service registered: ${name} (${id})`);
    
    return res.json({
      success: true,
      message: 'Service registered successfully',
      service
    });
    
  } catch (error) {
    console.error('❌ Service registration failed:', error);
    return res.status(500).json({ error: 'Service registration failed' });
  }
});

// Discover services
app.get('/services/discover', (req, res) => {
  try {
    const { maxPrice, owner } = req.query;
    
    let services = Array.from(registeredServices.values())
      .filter(service => service.status === 'active');
    
    // Apply filters
    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice as string);
      services = services.filter(service => 
        parseFloat(service.pricing.amount) <= maxPriceNum
      );
    }
    
    if (owner) {
      services = services.filter(service => 
        service.owner.toLowerCase() === (owner as string).toLowerCase()
      );
    }
    
    console.log(`🔍 Service discovery request: found ${services.length} services`);
    
    res.json({
      success: true,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        endpoint: service.endpoint,
        pricing: service.pricing,
        owner: service.owner,
        registeredAt: service.registeredAt
      }))
    });
    
  } catch (error) {
    console.error('❌ Service discovery failed:', error);
    res.status(500).json({ error: 'Service discovery failed' });
  }
});

// Get specific service details
app.get('/services/:serviceId', (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = registeredServices.get(serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    return res.json({
      success: true,
      service
    });
    
  } catch (error) {
    console.error('❌ Failed to get service details:', error);
    return res.status(500).json({ error: 'Failed to get service details' });
  }
});

// Payment Processing Routes

// Process payment
app.post('/payments/process', async (req, res) => {
  try {
    const { amount, recipient, serviceId } = req.body;
    
    if (!amount || !recipient) {
      return res.status(400).json({
        error: 'Amount and recipient are required'
      });
    }
    
    console.log(`💳 Processing payment: ${amount} STT to ${recipient}`);
    
    // Make the payment using SDK
      const paymentResult = await sdk.sendTransaction(
        'SOMNIA_TESTNET',
        recipient,
        amount
      );
    
    // Record the payment
    const paymentRecord: PaymentRecord = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionHash: paymentResult.hash,
      from: sdk.getWalletAddress(),
      to: recipient,
      amount,
      timestamp: Date.now(),
      status: 'confirmed',
      serviceId
    };
    
    paymentRecords.set(paymentRecord.id, paymentRecord);
    
    console.log(`✅ Payment processed: ${paymentResult.hash}`);
    
    return res.json({
      success: true,
      message: 'Payment processed successfully',
      payment: paymentRecord,
      transactionHash: paymentResult.hash
    });
    
  } catch (error) {
    console.error('❌ Payment processing failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Payment processing failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Verify payment
app.get('/payments/verify/:transactionHash', async (req, res) => {
  try {
    const { transactionHash } = req.params;
    
    console.log(`🔍 Verifying payment: ${transactionHash}`);
    
    // Find payment record
    const paymentRecord = Array.from(paymentRecords.values())
      .find(record => record.transactionHash === transactionHash);
    
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }
    
    // Verify on blockchain
    try {
      const receipt = await sdk.getWalletManager().getProvider('SOMNIA_TESTNET').getTransactionReceipt(transactionHash);
      
      if (receipt) {
        paymentRecord.status = receipt.status === 1 ? 'confirmed' : 'failed';
        
        return res.json({
          success: true,
          payment: paymentRecord,
          blockchainStatus: {
            confirmed: receipt.status === 1,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
          }
        });
      } else {
        return res.json({
          success: true,
          payment: { ...paymentRecord, status: 'pending' },
          blockchainStatus: {
            confirmed: false,
            message: 'Transaction not yet mined'
          }
        });
      }
    } catch (blockchainError) {
      console.warn('⚠️ Blockchain verification failed:', blockchainError instanceof Error ? blockchainError.message : String(blockchainError));
      return res.json({
        success: true,
        payment: paymentRecord,
        blockchainStatus: {
          confirmed: false,
          error: 'Blockchain verification unavailable'
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Payment verification failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Payment verification failed'
    });
  }
});

// Get payment history
app.get('/payments/history', (req, res) => {
  try {
    const { serviceId, limit = 50 } = req.query;
    
    let payments = Array.from(paymentRecords.values());
    
    if (serviceId) {
      payments = payments.filter(payment => payment.serviceId === serviceId);
    }
    
    // Sort by timestamp (newest first) and limit
    payments = payments
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      payments,
      total: payments.length
    });
    
  } catch (error) {
    console.error('❌ Failed to get payment history:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

// Facilitator status endpoint
app.get('/status', async (_req, res) => {
  try {
    const address = sdk.getWalletAddress();
    const balance = await sdk.getBalance('SOMNIA_TESTNET');
    
    res.json({
      status: 'running',
      facilitator: 'X402 Payment Facilitator',
      address,
      balance: `${balance} STT`,
      statistics: {
        registeredServices: registeredServices.size,
        totalPayments: paymentRecords.size,
        activeServices: Array.from(registeredServices.values())
          .filter(s => s.status === 'active').length
      },
      endpoints: {
        '/services/register': { method: 'POST', description: 'Register new service' },
        '/services/discover': { method: 'GET', description: 'Discover available services' },
        '/payments/process': { method: 'POST', description: 'Process payment' },
        '/payments/verify/:hash': { method: 'GET', description: 'Verify payment' },
        '/payments/history': { method: 'GET', description: 'Get payment history' },
        '/status': { method: 'GET', description: 'Facilitator status' }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get facilitator status' });
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start the facilitator
async function startFacilitator() {
  await initializeFacilitator();
  
  app.listen(PORT, () => {
    console.log('\n🌐 X402 Payment Facilitator Started!');
    console.log('==========================================');
    console.log(`🚀 Facilitator running on: http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log(`   • GET /status - Facilitator status`);
    console.log(`   • GET /health - Health check`);
    console.log(`   • GET /services/discover - Discover services`);
    console.log(`   • POST /services/register - Register service`);
    console.log(`   • POST /payments/process - Process payment`);
    console.log(`   • GET /payments/verify/:hash - Verify payment`);
    console.log(`   • GET /payments/history - Payment history`);
    console.log('\n💡 Test with:');
    console.log(`   curl http://localhost:${PORT}/status`);
    console.log(`   curl http://localhost:${PORT}/services/discover`);
    console.log('==========================================\n');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down X402 facilitator...');
  process.exit(0);
});

// Start the facilitator
startFacilitator().catch(error => {
  console.error('❌ Failed to start facilitator:', error);
  process.exit(1);
});