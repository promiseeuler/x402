# X402 AI Facilitator Guide

This guide explains how to integrate AI services with the X402 payment protocol using OpenRouter API.

## Overview

The X402 AI Facilitator enables seamless integration of AI services with blockchain payments. Users can:

- Pay for AI requests using Somnia testnet tokens (STT)
- Run their own AI facilitator servers
- Integrate AI payments into existing platforms
- Verify payments on-chain
- Use embedded wallet management with password protection
- Access a professional React frontend for wallet and payment management
- Configure custom pricing and facilitator fees
- Monitor real-time payment statistics and analytics

## Quick Start

### 1. Environment Setup

Create a `.env` file with your configuration:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Facilitator Wallet
FACILITATOR_PRIVATE_KEY=your_private_key_here
WALLET_PASSWORD=your_secure_wallet_password

# Network Configuration
NETWORK=SOMNIA_TESTNET

# Server Configuration
PORT=3001

# Spending Limits
DAILY_SPENDING_LIMIT=100
PER_TRANSACTION_LIMIT=10

# Frontend Configuration (optional)
REACT_APP_FACILITATOR_URL=http://localhost:3001
REACT_APP_FACILITATOR_FEE=0.1
REACT_APP_PRICE_CLAUDE_HAIKU=0.001
REACT_APP_PRICE_CLAUDE_SONNET=0.0015
REACT_APP_PRICE_GPT35=0.002
REACT_APP_PRICE_GPT4=0.005
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run AI Facilitator Server

```bash
npm run example:ai-server
```

### 4. Run Frontend Application (Optional)

```bash
cd frontend
npm install
npm run dev
```

### 5. Test with Client

```bash
npm run example:ai-client
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Frontend │───▶│  AI Facilitator │───▶│  OpenRouter AI  │
│   (Optional)    │    │     Server      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐              │
│ Embedded Wallet │    │ Somnia Testnet  │              │
│   Management    │    │   Blockchain    │              │
└─────────────────┘    └─────────────────┘              │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    Payment Verification
```

### Component Overview

- **React Frontend**: Professional UI for wallet management and AI payments
- **AI Facilitator Server**: Handles payment processing and AI service routing
- **Embedded Wallet Manager**: Secure wallet with password protection and recovery
- **X402 Protocol**: Core payment protocol for blockchain transactions
- **OpenRouter AI**: AI service provider integration

## Core Components

### AIFacilitator

The main service that handles AI requests with payments:

```typescript
import { AIFacilitator, EmbeddedWalletManager } from '@x402/sdk';

const walletManager = new EmbeddedWalletManager({
  privateKey: process.env.FACILITATOR_PRIVATE_KEY,
  password: process.env.WALLET_PASSWORD,
  network: 'SOMNIA_TESTNET',
  autoSave: true,
  autoLock: true,
  lockTimeout: 300000 // 5 minutes
});

const aiFacilitator = new AIFacilitator({
  walletManager,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  network: 'SOMNIA_TESTNET',
  spendingLimits: {
    maxPerRequest: '10',
    maxTotal: '100',
    daily: '100',
    windowSeconds: 86400,
    currentSpending: '0',
    windowStart: Date.now()
  },
  debug: true
});
```

### EmbeddedWalletManager

Secure wallet management with password protection:

```typescript
import { EmbeddedWalletManager } from '@x402/sdk';

const walletManager = new EmbeddedWalletManager({
  password: 'your-secure-password',
  network: 'SOMNIA_TESTNET',
  autoSave: true,
  autoLock: true,
  lockTimeout: 300000
});

// Create new wallet
const { mnemonic, address } = await walletManager.createSecureWallet('password');

// Import from mnemonic
await walletManager.importFromMnemonic('your mnemonic phrase', 'password');

// Unlock wallet
await walletManager.unlock('password');

// Create backup
const backup = await walletManager.createBackup('password');
```

### FacilitatorClient

Communication layer for facilitator services:

```typescript
import { FacilitatorClient } from '@x402/sdk';

const facilitatorClient = new FacilitatorClient({
  baseUrl: 'http://localhost:3001',
  apiKey: 'optional-api-key',
  timeout: 30000,
  maxRetries: 3,
  debug: true
});

// Request payment quote
const quote = await facilitatorClient.requestQuote(
  'ai-service',
  'text-generation',
  'SOMNIA_TESTNET'
);

// Verify payment
const verification = await facilitatorClient.verifyPayment(
  transactionHash,
  'SOMNIA_TESTNET'
);
```

### OpenRouterAI Service

Handles AI model interactions:

```typescript
import { OpenRouterAI, X402Protocol } from '@x402/sdk';

const openRouterAI = new OpenRouterAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  protocol: x402Protocol,
  defaultModel: 'anthropic/claude-3-haiku',
  maxTokens: 1000,
  temperature: 0.7,
  debug: true
});
```

### X402SDK

Unified SDK interface for all X402 functionality:

```typescript
import { X402SDK } from '@x402/sdk';

const sdk = new X402SDK({
  defaultNetwork: 'SOMNIA_TESTNET',
  wallet: {
    privateKey: process.env.PRIVATE_KEY,
    createRandom: false
  },
  spendingLimits: {
    maxPerRequest: '10',
    maxTotal: '100',
    windowSeconds: 86400
  },
  facilitator: {
    baseUrl: 'http://localhost:3001',
    apiKey: 'optional-key'
  },
  options: {
    debug: true,
    timeout: 30000,
    maxRetries: 3
  }
});

// Get wallet balance
const balance = await sdk.getBalance('SOMNIA_TESTNET');

// Make payment
const result = await sdk.makePayment({
  amount: '0.001',
  recipient: '0x...',
  network: 'SOMNIA_TESTNET'
});
```

## API Endpoints

### Health Check
```
GET /health
```

### Get Available Models
```
GET /api/models
```

### Estimate Cost
```
POST /api/estimate
{
  "model": "anthropic/claude-3-haiku",
  "prompt": "Your question here",
  "maxTokens": 500
}
```

### Process AI Request
```
POST /api/request
{
  "model": "anthropic/claude-3-haiku",
  "prompt": "Your question here",
  "maxTokens": 500,
  "temperature": 0.7,
  "userId": "user123",
  "metadata": {}
}
```

### Verify Payment
```
POST /api/verify-payment
{
  "transactionHash": "0x..."
}
```

### Get Request Status
```
GET /api/request/:id/status
```

### Get Statistics
```
GET /api/stats
```

## Frontend Application

The X402 SDK includes a professional React frontend for wallet management and AI payments.

### Features

- **🔐 Embedded Wallet System**: Secure wallet creation, import, and password protection
- **💳 AI Payment Management**: Support for multiple AI providers with real-time payments
- **🎨 Professional UI/UX**: Material Design with dark/light theme support
- **📱 Mobile Responsive**: Optimized for all device sizes
- **🔒 Security**: Encrypted storage with backup and recovery options

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3004`

### Frontend Configuration

Create a `.env` file in the frontend directory:

```bash
# Facilitator server URL
REACT_APP_FACILITATOR_URL=http://localhost:3001

# Facilitator fee percentage (0.1 = 10%)
REACT_APP_FACILITATOR_FEE=0.1

# AI model pricing (in STT tokens)
REACT_APP_PRICE_CLAUDE_HAIKU=0.001
REACT_APP_PRICE_CLAUDE_SONNET=0.0015
REACT_APP_PRICE_GPT35=0.002
REACT_APP_PRICE_GPT4=0.005
```

### Wallet Management

The frontend provides comprehensive wallet management:

```typescript
// Create new wallet
const { mnemonic, address } = await createWallet('secure-password');

// Import existing wallet
await importFromMnemonic('your mnemonic phrase', 'password');
await importFromPrivateKey('your-private-key', 'password');

// Unlock wallet
await unlock('password');

// Create backup
const backup = await createBackup('password');

// Restore from backup
await restoreFromBackup(backup, 'password');
```

### AI Payment Interface

The frontend includes a complete AI payment interface:

- Model selection with pricing information
- Real-time cost estimation
- Payment confirmation and processing
- Transaction history and status tracking
- Balance monitoring and refresh

## Integration Examples

### Web Application Integration

```typescript
import { AIFacilitatorClient } from './ai-facilitator-client';

class MyWebApp {
  private aiClient: AIFacilitatorClient;

  constructor() {
    this.aiClient = new AIFacilitatorClient('http://localhost:3001');
  }

  async askAI(userQuestion: string): Promise<string> {
    // Estimate cost first
    const cost = await this.aiClient.estimateCost(
      'anthropic/claude-3-haiku',
      userQuestion
    );

    // Show cost to user and get confirmation
    const userConfirmed = await this.showCostConfirmation(cost);
    if (!userConfirmed) return;

    // Make the AI request
    const response = await this.aiClient.makeAIRequest(
      'anthropic/claude-3-haiku',
      userQuestion
    );

    return response.content;
  }

  private async showCostConfirmation(cost: any): Promise<boolean> {
    // Implement your UI confirmation logic
    return confirm(`This will cost ${cost.totalCost} STT. Continue?`);
  }
}
```

### React Component Integration

```typescript
import React, { useState } from 'react';
import { AIFacilitatorClient } from './ai-facilitator-client';

const AIChat: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState<any>(null);

  const aiClient = new AIFacilitatorClient('http://localhost:3001');

  const handleEstimate = async () => {
    if (!question) return;
    
    const estimate = await aiClient.estimateCost(
      'anthropic/claude-3-haiku',
      question
    );
    setCost(estimate);
  };

  const handleSubmit = async () => {
    if (!question) return;
    
    setLoading(true);
    try {
      const aiResponse = await aiClient.makeAIRequest(
        'anthropic/claude-3-haiku',
        question
      );
      setResponse(aiResponse.content);
    } catch (error) {
      console.error('AI request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask your question..."
      />
      
      <button onClick={handleEstimate}>Estimate Cost</button>
      
      {cost && (
        <div>
          <p>Cost: {cost.totalCost} STT</p>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Submit & Pay'}
          </button>
        </div>
      )}
      
      {response && (
        <div>
          <h3>AI Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};
```

## Available AI Models

The facilitator supports various OpenRouter models with configurable pricing:

- **Claude 3 Haiku** (`anthropic/claude-3-haiku`) - Fast and efficient (0.001 STT)
- **Claude 3 Sonnet** (`anthropic/claude-3-sonnet`) - Balanced performance (0.0015 STT)
- **GPT-3.5 Turbo** (`openai/gpt-3.5-turbo`) - OpenAI's efficient model (0.002 STT)
- **GPT-4** (`openai/gpt-4`) - OpenAI's most capable model (0.005 STT)

### Model Configuration

Pricing can be configured via environment variables or the facilitator config:

```typescript
export const facilitatorConfig = {
  baseUrl: 'http://localhost:3001',
  facilitatorFeePercentage: 0.1, // 10% fee
  pricePerRequest: {
    'anthropic/claude-3-haiku': 0.001,
    'anthropic/claude-3-sonnet': 0.0015,
    'openai/gpt-3.5-turbo': 0.002,
    'openai/gpt-4': 0.005
  }
};

// Calculate total cost including facilitator fee
const totalCost = calculateTotalCost(baseCost);
const facilitatorFee = getFacilitatorFee(baseCost);
```

## Payment Flow

1. **Cost Estimation**: Calculate the cost for an AI request
2. **Payment Initiation**: User confirms and initiates payment
3. **Blockchain Transaction**: Payment is processed on Somnia testnet
4. **AI Request**: Once payment is confirmed, AI request is made
5. **Response Delivery**: AI response is returned to the user
6. **Payment Verification**: Transaction can be verified on-chain

## Error Handling

The facilitator handles various error scenarios:

- **Insufficient Balance**: User doesn't have enough STT tokens
- **Payment Failure**: Blockchain transaction fails
- **AI Service Error**: OpenRouter API issues
- **Network Issues**: Connection problems
- **Rate Limiting**: Too many requests

## Security Considerations

1. **Private Key Management**: Store facilitator private keys securely
2. **API Key Protection**: Keep OpenRouter API keys confidential
3. **Spending Limits**: Configure appropriate daily and per-transaction limits
4. **Input Validation**: Validate all user inputs
5. **Rate Limiting**: Implement rate limiting to prevent abuse

## Monitoring and Analytics

The facilitator provides comprehensive statistics and monitoring:

```typescript
// Get facilitator statistics
const stats = await aiFacilitator.getStatistics();
console.log({
  activeRequests: stats.activeRequests,
  completedRequests: stats.completedRequests,
  totalRevenue: stats.totalRevenue,
  averageRequestCost: stats.averageRequestCost,
  topModels: stats.topModels
});

// Get service-specific stats
const serviceStats = await facilitatorClient.getServiceStats(
  'ai-service',
  'day' // timeframe: hour, day, week, month
);

console.log({
  totalPayments: serviceStats.totalPayments,
  totalRevenue: serviceStats.totalRevenue,
  requestCount: serviceStats.requestCount,
  averagePayment: serviceStats.averagePayment,
  topOperations: serviceStats.topOperations
});
```

### Event Monitoring

The AI Facilitator emits events for real-time monitoring:

```typescript
aiFacilitator.on('requestStarted', (request) => {
  console.log(`🚀 AI request started: ${request.id}`);
});

aiFacilitator.on('costCalculated', (data) => {
  console.log(`💰 Cost calculated: ${data.cost.totalCost} STT`);
});

aiFacilitator.on('paymentInitiated', (payment) => {
  console.log(`💳 Payment initiated: ${payment.transactionHash}`);
});

aiFacilitator.on('paymentCompleted', (payment) => {
  console.log(`✅ Payment completed: ${payment.transactionHash}`);
});

aiFacilitator.on('requestCompleted', (response) => {
  console.log(`🎉 AI request completed: ${response.id}`);
});

aiFacilitator.on('requestFailed', (data) => {
  console.error(`❌ AI request failed: ${data.error}`);
});
```

### Health Monitoring

```typescript
// Check facilitator health
const health = await facilitatorClient.healthCheck();
console.log({
  status: health.status, // 'healthy' | 'degraded' | 'unhealthy'
  version: health.version,
  uptime: health.uptime,
  supportedNetworks: health.supportedNetworks
});
```

## Production Features

### Spending Limits and Security

The SDK includes comprehensive spending limit controls:

```typescript
const spendingLimits = {
  maxPerRequest: '10',    // Maximum per single request
  maxTotal: '100',        // Maximum total spending
  daily: '100',           // Daily spending limit
  windowSeconds: 86400,   // Time window for limits
  currentSpending: '0',   // Current spending in window
  windowStart: Date.now() // Window start timestamp
};

// Update spending limits
sdk.updateSpendingLimits(spendingLimits);

// Check current spending
const currentSpending = sdk.getCurrentSpending('SOMNIA_TESTNET', 'STT');

// Clear spending history
sdk.clearSpendingHistory();
```

### Wallet Security Features

```typescript
// Auto-lock wallet after timeout
const walletManager = new EmbeddedWalletManager({
  password: 'secure-password',
  autoLock: true,
  lockTimeout: 300000, // 5 minutes
  autoSave: true
});

// Change wallet password
await walletManager.changePassword('old-password', 'new-password');

// Export wallet data
const mnemonic = await walletManager.exportMnemonic();
const privateKey = await walletManager.exportPrivateKey();

// Create encrypted backup
const backup = await walletManager.createBackup('backup-password');

// Restore from backup
await walletManager.restoreFromBackup(backup, 'backup-password');
```

### Production Error Handling

```typescript
try {
  const response = await aiFacilitator.processRequest(request);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    // Handle insufficient balance
  } else if (error.code === 'SPENDING_LIMIT_EXCEEDED') {
    // Handle spending limit
  } else if (error.code === 'PAYMENT_FAILED') {
    // Handle payment failure
  } else if (error.code === 'AI_SERVICE_ERROR') {
    // Handle AI service error
  }
}
```

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "example:ai-server"]
```

### Frontend Deployment

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables for Production

```bash
# Production configuration
NODE_ENV=production
PORT=3001
OPENROUTER_API_KEY=your_production_api_key
FACILITATOR_PRIVATE_KEY=your_production_private_key
WALLET_PASSWORD=your_secure_wallet_password
NETWORK=SOMNIA_MAINNET
DAILY_SPENDING_LIMIT=1000
PER_TRANSACTION_LIMIT=50
DEBUG=false

# Frontend production variables
REACT_APP_FACILITATOR_URL=https://your-facilitator-domain.com
REACT_APP_FACILITATOR_FEE=0.05
REACT_APP_PRICE_CLAUDE_HAIKU=0.001
REACT_APP_PRICE_CLAUDE_SONNET=0.0015
REACT_APP_PRICE_GPT35=0.002
REACT_APP_PRICE_GPT4=0.005
```

### Load Balancing and Scaling

```yaml
# docker-compose.yml for production
version: '3.8'
services:
  facilitator:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - FACILITATOR_PRIVATE_KEY=${FACILITATOR_PRIVATE_KEY}
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
  
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - facilitator
  
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - facilitator
      - frontend
```

## Troubleshooting

### Common Issues

1. **"AI service not initialized"**
   - Ensure wallet is connected
   - Check OpenRouter API key
   - Verify network configuration

2. **"Payment failed"**
   - Check wallet balance
   - Verify network connectivity
   - Ensure spending limits are not exceeded

3. **"Model not available"**
   - Check OpenRouter API status
   - Verify model ID is correct
   - Ensure API key has access to the model

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const aiFacilitator = new AIFacilitator({
  // ... other config
  debug: true
});
```



## License

MIT License - see LICENSE file for details.