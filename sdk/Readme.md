# X402 SDK - Self-Sovereign Payment System

A TypeScript SDK for the X402 self-sovereign payment system, enabling automatic micropayments for API access using HTTP 402 protocol with blockchain settlement.

## Features

- 🔗 **Multi-chain Support**: Ethereum, Polygon, Arbitrum, Base, and **Somnia Testnet**
- 💰 **Automatic Payments**: Seamless HTTP 402 payment handling
- 🔐 **Self-Sovereign**: Your keys, your control
- 🛡️ **Spending Limits**: Built-in protection against overspending
- 🚀 **Easy Integration**: Simple API for developers
- 📊 **Payment Tracking**: Monitor spending across networks

## Installation

```bash
npm install x402-sdk
# or
yarn add x402-sdk
```

## Quick Start

### Basic Usage

```typescript
import { X402SDK } from 'x402-sdk';

// Create SDK with random wallet
const sdk = await X402SDK.createWithRandomWallet('somnia-testnet', {
  spendingLimits: {
    maxPerRequest: '1.0',  // Max 1 STT per request
    maxTotal: '10.0',      // Max 10 STT total
    windowSeconds: 3600    // 1 hour window
  }
});

// Make API requests with automatic payment handling
const response = await sdk.get('https://api.example.com/data');
console.log(response.data);
```

### Using Existing Wallet

```typescript
// From private key
const sdk = await X402SDK.createFromPrivateKey(
  'your-private-key',
  'somnia-testnet'
);

// From mnemonic
const sdk = await X402SDK.createFromMnemonic(
  'your twelve word mnemonic phrase here',
  'somnia-testnet'
);
```

## Somnia Testnet Support

The SDK includes full support for Somnia testnet:

- **RPC URL**: `https://dream-rpc.somnia.network`
- **Chain ID**: `50312` (`0xc488`)
- **Explorer**: `https://shannon-explorer.somnia.network/`
- **Native Token**: `STT` (Somnia Test Token)

```typescript
// Get Somnia testnet configuration
const config = sdk.getNetworkConfig('somnia-testnet');
console.log(config.chainId); // 50312
console.log(config.nativeCurrency.symbol); // STT
```

## API Reference

### SDK Creation

```typescript
// Create with random wallet
const sdk = await X402SDK.createWithRandomWallet(network, options?);

// Create from private key
const sdk = await X402SDK.createFromPrivateKey(privateKey, network, options?);

// Create from mnemonic
const sdk = await X402SDK.createFromMnemonic(mnemonic, network, options?);
```

### HTTP Methods

```typescript
// GET request
const response = await sdk.get(url, headers?);

// POST request
const response = await sdk.post(url, data?, headers?);

// PUT request
const response = await sdk.put(url, data?, headers?);

// DELETE request
const response = await sdk.delete(url, headers?);

// Generic request
const response = await sdk.request({
  method: 'GET',
  url: 'https://api.example.com',
  headers: { 'Custom-Header': 'value' }
});
```

### Wallet Operations

```typescript
// Get wallet address
const address = sdk.getWalletAddress();

// Get balance
const balance = await sdk.getBalance('somnia-testnet');

// Check sufficient balance
const hasFunds = await sdk.hasSufficientBalance('somnia-testnet', '1.0');

// Export private key (use with caution)
const privateKey = sdk.exportPrivateKey();
```

### Network Management

```typescript
// Get supported networks
const networks = sdk.getSupportedNetworks();

// Get network configuration
const config = sdk.getNetworkConfig('somnia-testnet');

// Switch default network
sdk.switchNetwork('ethereum');
```

### Spending Management

```typescript
// Get current spending
const spending = sdk.getCurrentSpending('somnia-testnet', 'STT');

// Clear spending history
sdk.clearSpendingHistory();

// Update spending limits
sdk.updateSpendingLimits({
  maxPerRequest: '2.0',
  maxTotal: '20.0',
  windowSeconds: 7200
});
```

## Configuration Options

```typescript
interface X402SDKOptions {
  defaultNetwork: NetworkName;
  wallet: {
    privateKey?: string;
    mnemonic?: string;
    createRandom?: boolean;
  };
  spendingLimits?: {
    maxPerRequest: string;  // Maximum amount per request
    maxTotal: string;       // Maximum total in time window
    windowSeconds: number;  // Time window in seconds
  };
  facilitator?: {
    baseUrl: string;
    apiKey?: string;
  };
  options?: {
    debug?: boolean;        // Enable debug logging
    timeout?: number;       // Request timeout (ms)
    maxRetries?: number;    // Max payment retries
  };
}
```

## Supported Networks

| Network | Chain ID | Native Token |
|---------|----------|-------------|
| Ethereum | 1 | ETH |
| Polygon | 137 | MATIC |
| Arbitrum | 42161 | ETH |
| Base | 8453 | ETH |
| **Somnia Testnet** | **50312** | **STT** |

## Error Handling

```typescript
try {
  const response = await sdk.get('https://api.example.com/data');
  console.log(response.data);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log('Not enough balance for payment');
  } else if (error.code === 'PAYMENT_REQUIRED') {
    console.log('Service requires payment');
  } else {
    console.log('Other error:', error.message);
  }
}
```

## Examples

See the `examples/` directory for complete usage examples:

- `basic-usage.ts` - Basic SDK usage with Somnia testnet

```bash
# Run the basic example
npm run example:basic
```

## Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Testing

The SDK includes comprehensive tests:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- X402SDK.test.ts

# Run tests in watch mode
npm run test:watch
```

## Security

- 🔐 **Private Keys**: Never share or commit private keys
- 💰 **Spending Limits**: Always configure appropriate spending limits
- 🛡️ **Network Security**: Use secure RPC endpoints
- 🔍 **Code Review**: Review all payment transactions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support:

- 📖 Documentation: [X402 Project Documentation](../Project.md)
- 🐛 Issues: [GitHub Issues](https://github.com/x402/sdk/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/x402/sdk/discussions)

---

**Built with ❤️ for the decentralized web**