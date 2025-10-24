# X402 Treasure Hunt - Somnia Testnet Demo

A blockchain treasure hunting game demonstrating the **X402 Payment Protocol** on **Somnia Testnet**. Players discover hidden treasures by making micro-payments using the X402 standard, featuring a complete payment-gated API and interactive game interface.

## What is X402?

X402 is a payment protocol that extends HTTP with payment capabilities. When a resource requires payment, the server responds with `402 Payment Required` and includes payment details in X402 headers. This demo shows how X402 can create seamless payment-gated experiences with blockchain verification.

### Key Features:
- **HTTP Native**: Built on standard HTTP protocols
- **Instant Payments**: Immediate settlement using blockchain
- **Micropayments**: Perfect for small transactions (1 STT per treasure)
- **Chain Agnostic**: Works across different blockchains
- **Developer Friendly**: Simple integration with existing APIs

## Somnia Testnet

**Somnia** is a high-performance blockchain optimized for real-time applications and gaming. This demo runs on Somnia Testnet:

- **Chain ID**: 50312
- **RPC URL**: https://dream-rpc.somnia.network
- **Explorer**: https://shannon-explorer.somnia.network
- **Native Token**: STT (Somnia Test Token)

## Game Features

- **Interactive treasure map** with 12 clickable treasure locations
- **X402 payment flow** - pay 1 STT to discover each treasure
- **Wallet integration** using Thirdweb SDK v5
- **Progress tracking** with purchased treasures interface
- **Real-time blockchain verification** on Somnia Testnet
- **12 unique treasures** with different rarities, values, and lore
- **Complete treasure collection** with strategic positioning and powers
- **Responsive design** with modern UI/UX

### X402 Flow Demonstration
1. **Request**: Player clicks on treasure
2. **402 Response**: Server returns "Payment Required" with X402 headers
3. **Payment**: Player authorizes 1 STT payment through wallet
4. **Verification**: Server verifies transaction on blockchain
5. **Access Granted**: Treasure is revealed and progress updated

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MetaMask** or compatible Web3 wallet
- **Somnia Testnet** added to your wallet
- **STT tokens** for payments (get from faucet)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd x402-treasure-hunt
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment setup**:
   ```bash
   cp .env.example .env
   cp .env.example .env.local
   ```
   
   Edit `.env` with your configuration:
   ```env
   THIRDWEB_CLIENT_ID=your_thirdweb_client_id
   THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
   SERVER_WALLET_ADDRESS=your_server_wallet_address
   ```
   
   Edit `.env.local` for client-side variables:
   ```env
   VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
   ```

### API Keys

1. **Get Thirdweb API keys**:
   - Visit [Thirdweb Dashboard](https://thirdweb.com/dashboard)
   - Create a new project
   - Copy your Client ID and Secret Key

2. **Setup server wallet**:
   - Create a new wallet for receiving payments
   - Add the address to `SERVER_WALLET_ADDRESS`
   - Fund it with STT tokens for gas fees

### Get Testnet Tokens

1. **Add Somnia Testnet to MetaMask**:
   - Network Name: Somnia Testnet
   - RPC URL: https://dream-rpc.somnia.network
   - Chain ID: 50312
   - Currency Symbol: STT
   - Block Explorer: https://shannon-explorer.somnia.network

2. **Get STT tokens**:
   - Visit the Somnia faucet (check Somnia documentation)
   - Request test tokens for your wallet

## Running the Game

1. **Start all services**:
   ```bash
   npm run dev:full
   ```
   This starts:
   - Game server (port 3000)
   - Treasure API server (port 4000) 
   - Vite dev server (port 5173)

2. **Alternative - Start individual services**:
   ```bash
   # Game + Client only
   npm run dev
   
   # Or start services separately
   npm run server        # Game server
   npm run treasure-api  # Treasure API
   npm run client        # Vite dev server
   ```

3. **Open your browser**:
   - Game: http://localhost:5173
   - Game API: http://localhost:3000
   - Treasure API: http://localhost:4000

4. **Connect your wallet**:
   - Click "Connect Wallet"
   - Switch to Somnia Testnet when prompted

5. **Start playing**:
   - Click on treasure icons to discover them
   - Approve 1 STT payment for each treasure
   - View your purchased treasures and progress!

## Project Structure

```
d:\Github\x402
├── package.json              # Dependencies and scripts
├── .env                      # Environment configuration
├── .env.example              # Environment template
├── .env.local                # Client-side environment variables
├── .gitignore                # Git ignore rules
├── server.js                 # Main game server (port 3000)
├── treasure-api.js           # X402 treasure API server (port 4000)
├── vite.config.js           # Vite configuration with thirdweb optimization
├── public/
│   ├── index.html           # Game interface with responsive design
│   └── game.js              # Frontend game logic with Thirdweb v5
├── README.md                # This documentation
└── TREASURE_API_DOCS.md     # Detailed API documentation
```

## Technical Implementation

### Architecture Overview

The application consists of three main components:

1. **Game Server** (`server.js`) - Main application server
2. **Treasure API** (`treasure-api.js`) - X402 payment-gated API
3. **Frontend** (`public/`) - Interactive game interface

### Game Server (server.js)
- **Express.js** proxy server for game logic
- **CORS** enabled for frontend communication
- **API proxying** to treasure API server
- **Game state coordination** between services
- **Health monitoring** and status endpoints

### Treasure API (treasure-api.js)
- **X402 Protocol Implementation** with payment verification
- **Thirdweb SDK v5** for blockchain integration
- **12 Unique Treasures** with detailed metadata and lore
- **Payment verification** using blockchain transaction validation
- **Purchased treasures tracking** per wallet address
- **RESTful API** with comprehensive error handling

### Frontend (game.js)
- **Thirdweb SDK v5** for wallet connection and transactions
- **Somnia Testnet** integration with proper chain configuration
- **X402 payment flow** with modal-based payment interface
- **Interactive treasure map** with 12 clickable treasure locations
- **Real-time progress tracking** and purchased treasures display
- **Environment variable security** for API keys
- **Responsive design** with modern UI components

### X402 API Endpoints

#### `GET /api/treasures`
- Lists all available treasures (basic info)
- **Requires X402 payment** for access
- Returns treasure summaries with payment requirements

#### `GET /api/treasure/:treasureId`
- Returns detailed treasure data or 402 Payment Required
- Includes X402 headers for payment details
- **Protected endpoint** requiring payment verification

#### `GET /api/purchased/:walletAddress`
- Returns all purchased treasures for a wallet
- **No payment required** - shows owned content
- Includes purchase history and transaction details

#### `POST /api/verify`
- Verifies payment transaction on Somnia blockchain
- Updates player progress and generates access tokens
- Returns payment proof for subsequent API calls

#### `POST /api/settle`
- Handles payment settlement and finalization
- Confirms access to purchased content
- Updates internal payment tracking

## Educational Value

This demo teaches:

1. **X402 Protocol**: Complete implementation of payment-required HTTP responses
2. **Blockchain Integration**: Using Thirdweb SDK v5 for Web3 functionality
3. **Micro-payments**: Creating seamless payment experiences with real-time verification
4. **API Security**: Environment variable management and secure client-side configuration
5. **Game Development**: Building interactive blockchain games with state management
6. **Somnia Testnet**: Working with high-performance blockchain networks
7. **Modern Web Development**: Vite configuration, dependency optimization, and responsive design

## Testing

### Manual Testing
1. Connect wallet and verify Somnia Testnet connection
2. Click treasures and complete X402 payment flow
3. Verify transactions on Shannon Explorer
4. Check purchased treasures interface and progress updates
5. Test wallet disconnection and reconnection

### API Testing
```bash
# Test treasure list endpoint (should return 402)
curl http://localhost:4000/api/treasures

# Test specific treasure endpoint (should return 402)
curl http://localhost:4000/api/treasure/treasure_1

# Test payment verification
curl -X POST http://localhost:4000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"transactionHash":"0x...","treasureId":"treasure_1"}'

# Test purchased treasures
curl http://localhost:4000/api/purchased/0x...

# API documentation
curl http://localhost:4000/api/docs

# Health check
curl http://localhost:4000/api/health
```

## Troubleshooting

### Common Issues

1. **"Network not supported"**
   - Ensure Somnia Testnet is added to MetaMask
   - Check RPC URL and Chain ID are correct
   - Verify wallet is connected to the right network

2. **"Insufficient funds"**
   - Get STT tokens from Somnia faucet
   - Ensure you have enough for gas + payment (minimum 2 STT recommended)

3. **"Transaction failed"**
   - Check network congestion
   - Verify wallet has enough STT for gas
   - Try increasing gas limit
   - Ensure server wallet address is configured correctly

4. **"Payment verification failed"**
   - Wait for transaction confirmation on Somnia network
   - Check transaction hash on Shannon Explorer
   - Verify treasure API server is running on port 4000
   - Check server logs for verification errors

5. **"Environment variable errors"**
   - Ensure `.env.local` exists with `VITE_THIRDWEB_CLIENT_ID`
   - Restart development server after environment changes
   - Check that Thirdweb client ID is valid

6. **"Chunk loading errors"**
   - Clear Vite cache: `Remove-Item -Recurse -Force node_modules\.vite`
   - Restart development server
   - Check Vite configuration for dependency optimization

### Network Configuration

If you need to manually add Somnia Testnet:

```json
{
  "chainId": "0xC458",
  "chainName": "Somnia Testnet",
  "rpcUrls": ["https://dream-rpc.somnia.network"],
  "nativeCurrency": {
    "name": "STT",
    "symbol": "STT",
    "decimals": 18
  },
  "blockExplorerUrls": ["https://shannon-explorer.somnia.network"]
}
```

### Development Tips

- Use `npm run dev:full` to start all services at once
- Check browser console for client-side errors
- Monitor terminal output for server-side issues
- Use API documentation at `http://localhost:4000/api/docs`
- Test API endpoints individually before frontend integration

## Resources

- [X402 Protocol Specification](https://github.com/x402-protocol/x402-protocol)
- [Thirdweb Documentation](https://portal.thirdweb.com/)
- [Somnia Network](https://somnia.network/)
- [Shannon Explorer](https://shannon-explorer.somnia.network/)
- [Vite Documentation](https://vitejs.dev/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

---

## Treasure Collection

The game features 12 unique treasures with different rarities and strategic positioning:

### Legendary Treasures (3)
- **Golden Compass** - Points to hidden riches
- **Crystal of Wisdom** - Ancient magical energies
- **Phoenix Feather** - Shimmering with rebirth power

### Epic Treasures (4)
- **Dragon Scale Shield** - Impenetrable protection
- **Moonstone Amulet** - Lunar energy enhancement
- **Thunderbolt Spear** - Electric combat power
- **Emerald of Life** - Healing energy source

### Rare Treasures (3)
- **Shadow Cloak** - Stealth and concealment
- **Frost Crown** - Ice magic amplification
- **Flame Sword** - Burning combat weapon

### Common Treasures (2)
- **Silver Coin** - Basic currency treasure
- **Ancient Map** - Navigation assistance

Each treasure has unique lore, strategic value, and contributes to your collection's total worth!

Start your treasure hunting adventure and learn X402 payments today!