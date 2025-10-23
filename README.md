# 🏴‍☠️ X402 Treasure Hunt - Somnia Testnet Demo

An interactive mini-game demonstrating the X402 payment protocol on Somnia Testnet using the Thirdweb SDK. Players discover hidden treasures by making micropayments using the X402 standard.

## 🎯 What is X402?

X402 is an open payment protocol built around the HTTP 402 "Payment Required" status code. It enables services to charge for API access and content directly over HTTP using crypto-native payments, addressing limitations of traditional payment systems for machine-to-machine payments and micropayments.

### Key Features:
- **HTTP Native**: Built on standard HTTP protocols
- **Instant Payments**: Immediate settlement using blockchain
- **Micropayments**: Perfect for small transactions (1 STT per treasure)
- **Chain Agnostic**: Works across different blockchains
- **Developer Friendly**: Simple integration with existing APIs

## 🌐 Somnia Testnet

- **Network Name**: Somnia Testnet
- **Chain ID**: 50312
- **RPC URL**: https://dream-rpc.somnia.network
- **Native Token**: STT (Somnia Test Token)
- **Explorer**: https://shannon-explorer.somnia.network/

## 🎮 Game Features

### Core Gameplay
- **Treasure Discovery**: Click on hidden treasures to reveal them
- **X402 Payments**: Each treasure costs 1 STT using X402 protocol
- **Wallet Integration**: Connect MetaMask or compatible wallets
- **Real-time Verification**: Transactions verified on Somnia blockchain
- **Progress Tracking**: Track discoveries, spending, and achievements

### X402 Flow Demonstration
1. **Request**: Player clicks on treasure
2. **402 Response**: Server returns "Payment Required" with X402 headers
3. **Payment**: Player authorizes 1 STT payment through wallet
4. **Verification**: Server verifies transaction on blockchain
5. **Access Granted**: Treasure is revealed and progress updated

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MetaMask or compatible Web3 wallet
- Some STT tokens on Somnia Testnet

### Installation

1. **Clone and setup**:
   ```bash
   cd d:\Github\x402
   npm install
   ```

2. **Configure environment**:
   - Copy `.env` file and update with your values:
   ```env
   THIRDWEB_CLIENT_ID=your-thirdweb-client-id
   THIRDWEB_SECRET_KEY=your-thirdweb-secret-key
   SERVER_WALLET_ADDRESS=0xYourServerWalletAddress
   ```

3. **Get Thirdweb API Keys**:
   - Visit [Thirdweb Dashboard](https://thirdweb.com/dashboard)
   - Create a new project
   - Copy your Client ID and Secret Key

4. **Get Somnia Testnet Tokens**:
   - Add Somnia Testnet to MetaMask
   - Get STT tokens from faucet (if available)
   - Or bridge tokens to Somnia Testnet

### Running the Game

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Access the game**:
   - Backend API: http://localhost:3000
   - Frontend Game: http://localhost:5173

3. **Connect your wallet**:
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Switch to Somnia Testnet when prompted

4. **Start playing**:
   - Click on treasure icons (❓) to discover them
   - Approve 1 STT payment for each treasure
   - Watch your progress and collect achievements!

## 🏗️ Project Structure

```
d:\Github\x402
├── package.json          # Dependencies and scripts
├── .env                  # Environment configuration
├── server.js            # X402 backend server
├── vite.config.js       # Vite configuration
├── public/
│   ├── index.html       # Game interface
│   └── game.js          # Frontend game logic
└── README.md           # This file
```

## 🔧 Technical Implementation

### Backend (server.js)
- **Express.js** server with X402 endpoints
- **Thirdweb SDK** for blockchain integration
- **CORS** enabled for frontend communication
- **Game state management** with treasure generation
- **Payment verification** and settlement

### Frontend (game.js)
- **Thirdweb SDK** for wallet connection
- **Somnia Testnet** integration
- **X402 payment flow** implementation
- **Interactive game UI** with real-time updates
- **Transaction verification** with explorer links

### X402 Endpoints

#### `GET /api/treasure/:id`
- Returns treasure data or 402 Payment Required
- Includes X402 headers for payment details

#### `POST /api/verify`
- Verifies payment transaction on blockchain
- Updates player progress and achievements

#### `POST /api/settle`
- Handles payment settlement (demo implementation)

## 🎯 Educational Value

### X402 Protocol Learning
- **HTTP 402 Status**: Understanding payment-required responses
- **Blockchain Integration**: Real cryptocurrency transactions
- **Micropayments**: Demonstrating small-value transactions
- **Web3 UX**: Seamless wallet integration patterns

### Blockchain Concepts
- **Testnet Usage**: Safe environment for learning
- **Transaction Verification**: On-chain confirmation
- **Gas Fees**: Understanding transaction costs
- **Wallet Integration**: MetaMask and Web3 wallets

## 🧪 Testing

### Manual Testing
1. **Wallet Connection**: Test with different wallet states
2. **Network Switching**: Verify Somnia testnet integration
3. **Payment Flow**: Complete treasure discovery payments
4. **Error Handling**: Test with insufficient funds
5. **Transaction Verification**: Check explorer links

### API Testing
```bash
# Test treasure endpoint (should return 402)
curl http://localhost:3000/api/treasure/1

# Test game state
curl http://localhost:3000/api/game/state

# Test health check
curl http://localhost:3000/health
```

## 🔍 Troubleshooting

### Common Issues

1. **Wallet Connection Failed**:
   - Ensure MetaMask is installed and unlocked
   - Check if Somnia testnet is added to wallet
   - Verify network configuration

2. **Payment Transactions Fail**:
   - Check STT token balance
   - Ensure sufficient gas fees
   - Verify network connection

3. **Thirdweb Errors**:
   - Verify Client ID in environment variables
   - Check Thirdweb dashboard for API limits
   - Ensure correct SDK version

4. **Server Connection Issues**:
   - Verify backend server is running on port 3000
   - Check CORS configuration
   - Ensure environment variables are loaded

### Network Configuration

If Somnia testnet is not automatically added:

```javascript
// Manual network addition
Network Name: Somnia Testnet
RPC URL: https://dream-rpc.somnia.network
Chain ID: 50312
Currency Symbol: STT
Block Explorer: https://shannon-explorer.somnia.network/
```

## 📚 Resources

- [X402 Protocol Documentation](https://docs.x402.org/)
- [Thirdweb Documentation](https://portal.thirdweb.com/)
- [Somnia Network](https://somnia.network/)
- [Shannon Explorer](https://shannon-explorer.somnia.network/)
- [MetaMask Documentation](https://docs.metamask.io/)

## 🤝 Contributing

This is a demonstration project for educational purposes. Feel free to:
- Fork and experiment with the code
- Add new game features
- Improve the X402 implementation
- Enhance the user interface
- Add more comprehensive testing

## 📄 License

Apache-2.0 License - See LICENSE file for details.

## 🎉 Achievements System

- **First Discovery**: Find your first treasure
- **Treasure Hunter**: Discover 5 treasures
- **Master Explorer**: Find all 10 treasures

Start your treasure hunting adventure and learn X402 payments today! 🏴‍☠️💰