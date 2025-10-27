# X402 AI Facilitator Guide

This guide explains how to integrate AI services with the X402 payment protocol using OpenRouter API.

## Overview

The X402 AI Facilitator enables seamless integration of AI services with blockchain payments. Users can:

- Pay for AI requests using Somnia testnet tokens (STT)
- Run their own AI facilitator servers
- Integrate AI payments into existing platforms
- Verify payments on-chain

## Quick Start

### 1. Environment Setup

Create a `.env` file with your configuration:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Facilitator Wallet
FACILITATOR_PRIVATE_KEY=your_private_key_here

# Network Configuration
NETWORK=SOMNIA_TESTNET

# Server Configuration
PORT=3001

# Spending Limits
DAILY_SPENDING_LIMIT=100
PER_TRANSACTION_LIMIT=10
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run AI Facilitator Server

```bash
npm run example:ai-server
```

### 4. Test with Client

```bash
npm run example:ai-client
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Client   │───▶│  AI Facilitator │───▶│  OpenRouter AI  │
│                 │    │     Server      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐              │
│   X402 Wallet   │    │ Somnia Testnet  │              │
│                 │    │   Blockchain    │              │
└─────────────────┘    └─────────────────┘              │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    Payment Verification
```

## Core Components

### AIFacilitator

The main service that handles AI requests with payments:

```typescript
import { AIFacilitator, EmbeddedWalletManager } from '@x402/sdk';

const walletManager = new EmbeddedWalletManager({
  privateKey: process.env.FACILITATOR_PRIVATE_KEY,
  network: 'SOMNIA_TESTNET'
});

const aiFacilitator = new AIFacilitator({
  walletManager,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  network: 'SOMNIA_TESTNET',
  spendingLimits: {
    daily: 100,
    perTransaction: 10
  }
});
```

### OpenRouterAI Service

Handles AI model interactions:

```typescript
import { OpenRouterAI, X402Protocol } from '@x402/sdk';

const openRouterAI = new OpenRouterAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  protocol: x402Protocol,
  defaultModel: 'anthropic/claude-3-haiku',
  maxTokens: 1000
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

The facilitator supports various OpenRouter models:

- **Claude 3 Haiku** (`anthropic/claude-3-haiku`) - Fast and efficient
- **Claude 3 Sonnet** (`anthropic/claude-3-sonnet`) - Balanced performance
- **GPT-3.5 Turbo** (`openai/gpt-3.5-turbo`) - OpenAI's efficient model
- **GPT-4** (`openai/gpt-4`) - OpenAI's most capable model

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

The facilitator provides statistics:

```typescript
const stats = await aiFacilitator.getStatistics();
console.log({
  activeRequests: stats.activeRequests,
  completedRequests: stats.completedRequests,
  totalRevenue: stats.totalRevenue
});
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

### Environment Variables for Production

```bash
# Production configuration
NODE_ENV=production
PORT=3001
OPENROUTER_API_KEY=your_production_api_key
FACILITATOR_PRIVATE_KEY=your_production_private_key
NETWORK=SOMNIA_MAINNET
DAILY_SPENDING_LIMIT=1000
PER_TRANSACTION_LIMIT=50
DEBUG=false
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

## Support

For issues and questions:

- GitHub Issues: [X402 SDK Issues](https://github.com/your-org/x402-sdk/issues)
- Documentation: [X402 SDK Docs](https://docs.x402.dev)
- Discord: [X402 Community](https://discord.gg/x402)

## License

MIT License - see LICENSE file for details.