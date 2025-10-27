# AI Facilitator Setup Guide

This guide explains how to set up and configure the AI facilitator system for secure AI payments.

## Architecture Overview

The system follows this workflow:

1. **User submits a prompt request** (e.g., "What is the correct code structure for a Next.js app?")
2. **Frontend sends request to facilitator** with prompt and pricing details
3. **Facilitator deducts fees** and forwards the payment to the AI service
4. **Transaction confirmation** triggers AI processing
5. **AI response** is sent back to the client
6. **Frontend never has direct access** to API keys

## Configuration

### Easily Configurable Values

All pricing and fees can be configured via environment variables:

#### Frontend Configuration (`.env`)

```bash
# Facilitator server URL
REACT_APP_FACILITATOR_URL=http://localhost:3001

# Facilitator fee as a percentage (0.1 = 10%)
REACT_APP_FACILITATOR_FEE=0.1

# Price per request for each AI model (in STT tokens)
REACT_APP_PRICE_CLAUDE_HAIKU=0.001
REACT_APP_PRICE_CLAUDE_SONNET=0.0015
REACT_APP_PRICE_GPT35=0.002
REACT_APP_PRICE_GPT4=0.005
```

#### Backend Configuration (`examples/.env`)

```bash
# OpenRouter API Key (kept secure on server)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Facilitator wallet configuration
FACILITATOR_PRIVATE_KEY=your_private_key_here
WALLET_PASSWORD=your_wallet_password

# Server configuration
PORT=3001
```

## Running the System

### 1. Start the Facilitator Server

```bash
cd sdk
ts-node examples/ai-facilitator-server.ts
```

### 2. Start the Frontend

```bash
cd sdk/frontend
npm run dev
```

### 3. Access the Application

Open `http://localhost:3004` in your browser.

## Security Features

- ✅ **API keys never exposed to frontend**
- ✅ **Facilitator handles all AI service communication**
- ✅ **Configurable pricing and fees**
- ✅ **Transaction-based payment system**
- ✅ **Wallet-based authentication**

## API Endpoints

The facilitator server provides these endpoints:

- `POST /api/estimate` - Get cost estimate for AI request
- `POST /api/request` - Submit AI request with payment
- `GET /api/models` - List available AI models
- `GET /api/stats` - Get usage statistics

## Troubleshooting

### Common Issues

1. **"process is not defined" error**: This has been fixed by removing direct API key access from the frontend
2. **Connection refused**: Ensure the facilitator server is running on the correct port
3. **Invalid API key**: Check that `OPENROUTER_API_KEY` is set in the server environment

### Error Resolution

The system now properly handles:
- Environment variable loading
- API key security
- Frontend/backend separation
- Configurable pricing