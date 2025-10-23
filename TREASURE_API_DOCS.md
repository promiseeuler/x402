# X402 Treasure API Documentation

## Overview

The X402 Treasure API is a dedicated server that implements the X402 payment protocol for accessing treasure data. It provides secure, payment-gated access to treasure information with comprehensive blockchain verification.

## Architecture

```
Client Application
       ↓
Main Server (Port 3000)
       ↓ (Proxy)
Treasure API Server (Port 4000)
       ↓
Blockchain Verification
```

## Base URL

```
http://localhost:4000
```

## Authentication

All protected endpoints require payment verification through the X402 protocol. Include the payment ID in the request header:

```
X-Payment-ID: <payment_id>
```

## Endpoints

### Health Check

**GET** `/health`

Returns the API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### API Documentation

**GET** `/api/docs`

Returns comprehensive API documentation.

**Response:**
```json
{
  "name": "X402 Treasure API",
  "version": "1.0.0",
  "description": "Payment-gated treasure access API",
  "endpoints": [...]
}
```

### Get All Treasures (Protected)

**GET** `/api/treasures`

**Headers:**
- `X-Payment-ID`: Required payment verification ID

**Success Response (200):**
```json
{
  "success": true,
  "treasures": [
    {
      "id": "treasure_1",
      "name": "Golden Coin",
      "rarity": "Common",
      "value": 10,
      "x": 150,
      "y": 200,
      "discovered": true
    }
  ],
  "totalTreasures": 10,
  "paymentVerified": true
}
```

**Payment Required Response (402):**
```json
{
  "error": "Payment Required",
  "message": "X-Payment-ID header is required",
  "x402": {
    "price": "1",
    "currency": "STT",
    "chainId": "50312",
    "recipient": "0x20e7B473A2595A7BfA85D83D9151509AECA50b08",
    "verifyUrl": "http://localhost:4000/api/verify",
    "settleUrl": "http://localhost:4000/api/settle"
  }
}
```

### Get Specific Treasure (Protected)

**GET** `/api/treasure/:id`

**Parameters:**
- `id`: Treasure identifier

**Headers:**
- `X-Payment-ID`: Required payment verification ID

**Success Response (200):**
```json
{
  "success": true,
  "treasure": {
    "id": "treasure_1",
    "name": "Golden Coin",
    "rarity": "Common",
    "value": 10,
    "description": "A shimmering golden coin from ancient times",
    "x": 150,
    "y": 200,
    "discovered": true
  },
  "paymentVerified": true
}
```

**Treasure Not Found (404):**
```json
{
  "error": "Treasure not found",
  "treasureId": "treasure_999"
}
```

### Payment Verification

**POST** `/api/verify`

Verifies a blockchain transaction for payment.

**Request Body:**
```json
{
  "txHash": "0x1234567890abcdef...",
  "playerAddress": "0xabcdef1234567890...",
  "amount": "1",
  "currency": "STT"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "verified": true,
  "paymentId": "payment_abc123",
  "message": "Payment verified successfully",
  "transaction": {
    "hash": "0x1234567890abcdef...",
    "from": "0xabcdef1234567890...",
    "to": "0x20e7B473A2595A7BfA85D83D9151509AECA50b08",
    "value": "1000000000000000000",
    "blockNumber": 12345
  }
}
```

**Verification Failed (400):**
```json
{
  "error": "Payment verification failed",
  "details": "Transaction not found or invalid"
}
```

### Payment Settlement

**POST** `/api/settle`

Settles a verified payment.

**Request Body:**
```json
{
  "paymentId": "payment_abc123",
  "txHash": "0x1234567890abcdef..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "settled": true,
  "message": "Payment settled successfully"
}
```

### Game State

**GET** `/api/game/state`

Returns current game state information.

**Response:**
```json
{
  "totalTreasures": 10,
  "discoveredTreasures": 3,
  "paymentAmount": "1",
  "paymentToken": "STT",
  "chainId": "50312"
}
```

### Player Progress

**GET** `/api/player/:address/progress`

**Parameters:**
- `address`: Player wallet address

**Response:**
```json
{
  "playerAddress": "0xabcdef1234567890...",
  "treasuresFound": 3,
  "totalSpent": "3",
  "achievements": ["First Discovery", "Treasure Hunter"],
  "lastActivity": "2024-01-15T10:30:00.000Z"
}
```

### Reset Game

**POST** `/api/game/reset`

Resets the game state (development only).

**Response:**
```json
{
  "success": true,
  "message": "Game reset successfully",
  "newTreasureCount": 10
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error Type",
  "message": "Detailed error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `402` - Payment Required (X402)
- `404` - Not Found
- `500` - Internal Server Error

## X402 Protocol Implementation

### Payment Flow

1. **Request Protected Resource**: Client requests treasure data
2. **Payment Required**: Server responds with 402 and payment details
3. **Payment Submission**: Client submits blockchain transaction
4. **Verification**: Server verifies transaction on blockchain
5. **Access Granted**: Client can access protected resources

### X402 Headers

When payment is required, the API returns these X402 headers:

- `x402-price`: Payment amount required
- `x402-currency`: Payment currency (STT)
- `x402-chain-id`: Blockchain chain ID (50312)
- `x402-recipient`: Payment recipient address
- `x402-verify-url`: Verification endpoint URL
- `x402-settle-url`: Settlement endpoint URL

## Integration Examples

### JavaScript/Node.js

```javascript
// Request treasure data
const response = await fetch('http://localhost:4000/api/treasures', {
  headers: {
    'X-Payment-ID': paymentId
  }
});

if (response.status === 402) {
  // Payment required
  const paymentInfo = await response.json();
  // Handle payment flow
} else {
  // Access granted
  const treasures = await response.json();
}
```

### Payment Verification

```javascript
// Verify payment
const verifyResponse = await fetch('http://localhost:4000/api/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    txHash: transactionHash,
    playerAddress: walletAddress,
    amount: '1',
    currency: 'STT'
  })
});

const verification = await verifyResponse.json();
if (verification.success) {
  const paymentId = verification.paymentId;
  // Use paymentId for subsequent requests
}
```

## Security Considerations

1. **Transaction Verification**: All payments are verified on the Somnia blockchain
2. **Payment Expiry**: Payment IDs expire after 1 hour
3. **Rate Limiting**: API implements rate limiting to prevent abuse
4. **Input Validation**: All inputs are validated and sanitized
5. **Error Handling**: Sensitive information is not exposed in error messages

## Environment Variables

```bash
# Treasure API Configuration
TREASURE_API_PORT=4000
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
SOMNIA_CHAIN_ID=50312
SERVER_WALLET_ADDRESS=0x20e7B473A2595A7BfA85D83D9151509AECA50b08
THIRDWEB_CLIENT_ID=your_client_id
TREASURE_REVEAL_COST=1
MAX_TREASURES=10
```

## Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Treasure API**:
   ```bash
   npm run treasure-api
   ```

4. **Start Full Development Environment**:
   ```bash
   npm run dev:full
   ```

## Testing

### Health Check
```bash
curl http://localhost:4000/health
```

### Request Treasure (No Payment)
```bash
curl http://localhost:4000/api/treasures
# Should return 402 Payment Required
```

### Verify Payment
```bash
curl -X POST http://localhost:4000/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0x123...",
    "playerAddress": "0xabc...",
    "amount": "1",
    "currency": "STT"
  }'
```

## Support

For issues and questions:
- Check the health endpoint: `GET /health`
- Review server logs for detailed error information
- Ensure all environment variables are properly configured
- Verify blockchain connectivity to Somnia testnet