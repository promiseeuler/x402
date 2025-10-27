# X402 Frontend - AI Payment Infrastructure

A professional React-based frontend interface for the X402 AI payment system, featuring embedded wallet management and seamless AI service integration.

## Features

### 🔐 Embedded Wallet System
- **Secure Wallet Creation**: Generate new wallets with mnemonic phrases
- **Wallet Import**: Import existing wallets using mnemonic or private key
- **Password Protection**: Encrypted storage with password-based security
- **Backup & Recovery**: Create encrypted backups and restore wallets
- **Multi-Network Support**: Support for different blockchain networks

### 💳 AI Payment Management
- **Multiple AI Providers**: Support for OpenAI, Anthropic, Stability AI, and more
- **Real-time Payments**: Instant payments for AI service requests
- **Transaction History**: Complete payment history with detailed records
- **Cost Tracking**: Monitor spending and usage statistics
- **Payment Security**: Secure transaction processing with confirmation

### 🎨 Professional UI/UX
- **Material Design**: Modern, responsive interface using Material-UI
- **Dark/Light Theme**: Adaptive theming support
- **Mobile Responsive**: Optimized for all device sizes
- **Accessibility**: WCAG compliant with keyboard navigation
- **Real-time Updates**: Live balance and transaction updates

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser with MetaMask support (optional)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_FACILITATOR_URL=http://localhost:3000

# Network Configuration
VITE_NETWORK_NAME=sepolia
VITE_NETWORK_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
VITE_NETWORK_CHAIN_ID=11155111

# Application Configuration
VITE_APP_NAME=X402
VITE_APP_VERSION=1.0.0
```

## Integration Guide

### Standalone Usage

Run the frontend as a standalone application:

```bash
npm run dev
```

Access the application at `http://localhost:5173`

### Embedding in Existing Applications

#### Option 1: NPM Package Integration

```bash
npm install @x402/frontend
```

```tsx
import { X402Widget } from '@x402/frontend';
import '@x402/frontend/dist/style.css';

function MyApp() {
  return (
    <div>
      <h1>My Application</h1>
      <X402Widget 
        config={{
          apiUrl: 'http://localhost:3001',
          facilitatorUrl: 'http://localhost:3000',
          network: 'sepolia'
        }}
      />
    </div>
  );
}
```

#### Option 2: iframe Integration

```html
<iframe 
  src="http://localhost:5173" 
  width="400" 
  height="600"
  frameborder="0"
  title="X402 Wallet"
></iframe>
```

#### Option 3: Web Component

```html
<script src="https://unpkg.com/@x402/frontend/dist/x402-widget.js"></script>

<x402-widget 
  api-url="http://localhost:3001"
  facilitator-url="http://localhost:3000"
  network="sepolia"
></x402-widget>
```

## API Integration

### Wallet Context

The frontend provides a React context for wallet management:

```tsx
import { useWallet } from '@x402/frontend';

function MyComponent() {
  const { 
    state, 
    createWallet, 
    importWallet, 
    unlockWallet,
    makePayment 
  } = useWallet();

  const handlePayment = async () => {
    try {
      const result = await makePayment({
        providerId: 'openai',
        amount: 0.002,
        requestData: { prompt: 'Hello, AI!' }
      });
      console.log('Payment successful:', result);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <div>
      <p>Wallet Address: {state.address}</p>
      <p>Balance: {state.balance} STT</p>
      <button onClick={handlePayment}>Make AI Payment</button>
    </div>
  );
}
```

### Custom AI Providers

Add custom AI providers to the system:

```tsx
import { addAIProvider } from '@x402/frontend';

addAIProvider({
  id: 'custom-ai',
  name: 'Custom AI Service',
  description: 'My custom AI provider',
  baseUrl: 'https://api.custom-ai.com/v1',
  costPerRequest: 0.001,
  currency: 'STT',
  features: ['Text Generation', 'Custom Feature']
});
```

## Configuration

### Wallet Configuration

```tsx
const walletConfig = {
  // Network settings
  network: {
    name: 'sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    chainId: 11155111
  },
  
  // Security settings
  security: {
    passwordMinLength: 8,
    requireBackup: true,
    autoLockTimeout: 300000 // 5 minutes
  },
  
  // UI settings
  ui: {
    theme: 'light', // 'light' | 'dark' | 'auto'
    language: 'en',
    currency: 'STT'
  }
};
```

### Payment Configuration

```tsx
const paymentConfig = {
  // Default payment settings
  defaults: {
    currency: 'STT',
    confirmationRequired: true,
    maxAmountPerTransaction: 1.0,
    dailySpendingLimit: 10.0
  },
  
  // AI provider settings
  providers: {
    openai: {
      enabled: true,
      customPricing: 0.002
    },
    anthropic: {
      enabled: true,
      customPricing: 0.0015
    }
  }
};
```

## Development

### Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── WalletSetup.tsx     # Wallet creation/import
│   │   ├── WalletDashboard.tsx # Main dashboard
│   │   ├── WalletSecurity.tsx  # Security features
│   │   └── AIPayments.tsx      # AI payment interface
│   ├── contexts/            # React contexts
│   │   └── WalletContext.tsx   # Wallet state management
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   └── hooks/              # Custom React hooks
├── public/                 # Static assets
└── dist/                   # Build output
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript checks

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Building for Production

```bash
# Build the application
npm run build

# The built files will be in the dist/ directory
# Deploy the contents of dist/ to your web server
```

## Security Considerations

### Wallet Security
- Private keys are encrypted and stored locally
- Passwords are never transmitted or stored in plain text
- Mnemonic phrases are only displayed when explicitly requested
- Auto-lock functionality prevents unauthorized access

### Network Security
- All API communications use HTTPS in production
- Transaction signing happens locally in the browser
- No sensitive data is transmitted to external servers

### Best Practices
- Always use HTTPS in production
- Implement proper CSP headers
- Regular security audits of dependencies
- User education on wallet security

## Troubleshooting

### Common Issues

**Wallet won't unlock**
- Verify password is correct
- Check if wallet data exists in localStorage
- Clear browser cache and try again

**Payments failing**
- Check network connection
- Verify sufficient balance
- Ensure facilitator service is running

**UI not loading**
- Check browser console for errors
- Verify all dependencies are installed
- Try clearing browser cache

### Debug Mode

Enable debug mode for detailed logging:

```env
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- GitHub Issues: [Create an issue](https://github.com/x402/sdk/issues)
- Documentation: [Full documentation](https://docs.x402.ai)
- Discord: [Join our community](https://discord.gg/x402)