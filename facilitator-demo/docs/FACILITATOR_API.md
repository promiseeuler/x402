# X402 Facilitator API Documentation

This document provides detailed API documentation for the X402 Facilitator server, which implements the core verification and settlement endpoints required by the X402 protocol.

## Base URL

```
http://localhost:3003
```

## Authentication

The facilitator API does not require authentication in this demo implementation. In production, you would typically implement API keys or other authentication mechanisms.

## Endpoints

### POST /verify

Verifies a payment payload against payment requirements.

**Purpose:** This endpoint is called by resource servers to validate that a client's payment meets the declared payment requirements before granting access to protected resources.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "paymentPayload": {
    "scheme": "transferWithAuthorization",
    "networkId": "8453",
    "amount": "1000000",
    "token": "0xA0b86a33E6441b8dB4B2f8b8C4b4b4b4b4b4b4b4",
    "recipient": "0x742d35Cc6634C0532925a3b8D4b4b4b4b4b4b4b4",
    "sender": "0x1234567890123456789012345678901234567890",
    "transactionHash": "0xabc123...",
    "nonce": 1698765432000,
    "timestamp": "2024-10-24T20:30:32.000Z"
  },
  "paymentDetails": {
    "scheme": "transferWithAuthorization",
    "networkId": "8453",
    "amount": "1000000",
    "token": "0xA0b86a33E6441b8dB4B2f8b8C4b4b4b4b4b4b4b4",
    "recipient": "0x742d35Cc6634C0532925a3b8D4b4b4b4b4b4b4b4"
  }
}
```

#### Response

**Success (200 OK):**
```json
{
  "valid": true,
  "transactionHash": "0xabc123def456789...",
  "blockNumber": 18123456,
  "confirmations": 12,
  "verifiedAt": "2024-10-24T20:30:33.000Z"
}
```

**Validation Error (400 Bad Request):**
```json
{
  "valid": false,
  "error": "Amount mismatch. Expected: 1000000, Received: 500000"
}
```

**Server Error (500 Internal Server Error):**
```json
{
  "valid": false,
  "error": "Internal server error during verification"
}
```

#### Validation Rules

The facilitator validates the following:

1. **Required Fields:** All required fields must be present in both paymentPayload and paymentDetails
2. **Amount Match:** `paymentPayload.amount` must equal `paymentDetails.amount`
3. **Token Match:** `paymentPayload.token` must equal `paymentDetails.token`
4. **Recipient Match:** `paymentPayload.recipient` must equal `paymentDetails.recipient`
5. **Transaction Hash Format:** Must be a valid 66-character hex string (0x + 64 hex chars)
6. **Blockchain Verification:** Transaction must exist and be confirmed on the blockchain

---

### POST /settle

Settles a verified payment on the blockchain.

**Purpose:** This endpoint is called by resource servers to execute the payment transaction on the blockchain after verification has passed.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "paymentPayload": {
    "scheme": "transferWithAuthorization",
    "networkId": "8453",
    "amount": "1000000",
    "token": "0xA0b86a33E6441b8dB4B2f8b8C4b4b4b4b4b4b4b4",
    "recipient": "0x742d35Cc6634C0532925a3b8D4b4b4b4b4b4b4b4",
    "sender": "0x1234567890123456789012345678901234567890",
    "transactionHash": "0xabc123...",
    "nonce": 1698765432000,
    "timestamp": "2024-10-24T20:30:32.000Z"
  },
  "paymentDetails": {
    "scheme": "transferWithAuthorization",
    "networkId": "8453",
    "amount": "1000000",
    "token": "0xA0b86a33E6441b8dB4B2f8b8C4b4b4b4b4b4b4b4",
    "recipient": "0x742d35Cc6634C0532925a3b8D4b4b4b4b4b4b4b4"
  }
}
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "transactionHash": "0xdef456abc789012...",
  "blockNumber": 18123457,
  "gasUsed": "21000",
  "status": "confirmed",
  "settledAt": "2024-10-24T20:30:35.000Z"
}
```

**Verification Failed (400 Bad Request):**
```json
{
  "success": false,
  "error": "Payment verification failed during settlement"
}
```

**Settlement Failed (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Settlement failed on blockchain"
}
```

#### Settlement Process

1. **Re-verification:** The payment is verified again before settlement for security
2. **Blockchain Submission:** The transaction is submitted to the blockchain
3. **Confirmation Wait:** The facilitator waits for blockchain confirmation
4. **Response:** Returns settlement details including transaction hash and block number

---

### GET /health

Health check endpoint for monitoring the facilitator service.

#### Response

**Success (200 OK):**
```json
{
  "status": "healthy",
  "service": "x402-facilitator",
  "timestamp": "2024-10-24T20:30:36.000Z",
  "endpoints": ["/verify", "/settle"]
}
```

---

### GET /

Root endpoint providing service information and documentation links.

#### Response

**Success (200 OK):**
```json
{
  "service": "X402 Facilitator Server",
  "description": "Provides payment verification and settlement services for x402 protocol",
  "version": "1.0.0",
  "endpoints": {
    "/verify": "POST - Verify payment payloads",
    "/settle": "POST - Settle payments on blockchain",
    "/health": "GET - Health check"
  },
  "documentation": "https://x402.gitbook.io/x402/core-concepts/facilitator"
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
- Missing required fields
- Invalid field values
- Validation failures

**500 Internal Server Error:**
- Blockchain connectivity issues
- Internal processing errors
- Unexpected exceptions

**503 Service Unavailable:**
- Facilitator service is down
- Blockchain network issues

### Error Response Format

All error responses follow this format:
```json
{
  "valid": false,        // For /verify endpoint
  "success": false,      // For /settle endpoint
  "error": "Description of the error"
}
```

## Rate Limiting

This demo implementation does not include rate limiting. In production, you should implement:

- **Request rate limits** per IP address
- **Payment verification limits** per wallet
- **Settlement frequency limits** to prevent spam

## Security Considerations

### Production Implementation

For production use, consider implementing:

1. **Authentication:** API keys or JWT tokens
2. **Request Signing:** Cryptographic signatures for requests
3. **Rate Limiting:** Prevent abuse and spam
4. **Input Validation:** Comprehensive validation of all inputs
5. **Logging:** Detailed audit logs for all operations
6. **Monitoring:** Real-time monitoring and alerting
7. **Blockchain Security:** Proper private key management and secure blockchain connections

### Mock vs Real Implementation

This demo uses mock blockchain verification. In production:

- Connect to actual blockchain networks (Base, Ethereum, Polygon, etc.)
- Implement real transaction verification
- Handle network-specific requirements
- Manage gas fees and transaction timing
- Implement proper error handling for blockchain failures

## Integration Examples

### Resource Server Integration

```javascript
// Verify payment with facilitator
const verifyPayment = async (paymentPayload, paymentDetails) => {
  const response = await axios.post(`${FACILITATOR_URL}/verify`, {
    paymentPayload,
    paymentDetails
  });
  
  return response.data.valid;
};

// Settle payment with facilitator
const settlePayment = async (paymentPayload, paymentDetails) => {
  const response = await axios.post(`${FACILITATOR_URL}/settle`, {
    paymentPayload,
    paymentDetails
  });
  
  return response.data;
};
```

### Error Handling Example

```javascript
try {
  const verification = await axios.post(`${FACILITATOR_URL}/verify`, {
    paymentPayload,
    paymentDetails
  });
  
  if (verification.data.valid) {
    const settlement = await axios.post(`${FACILITATOR_URL}/settle`, {
      paymentPayload,
      paymentDetails
    });
    
    if (settlement.data.success) {
      // Payment successful, serve resource
      return serveProtectedResource();
    }
  }
} catch (error) {
  if (error.response?.status === 503) {
    // Facilitator unavailable
    return res.status(503).json({
      error: 'Payment service temporarily unavailable'
    });
  }
  
  // Other errors
  return res.status(402).json({
    error: 'Payment verification failed'
  });
}
```

## Testing

Use the provided client example to test the facilitator:

```bash
# Test verification endpoint directly
curl -X POST http://localhost:3003/verify \
  -H "Content-Type: application/json" \
  -d '{
    "paymentPayload": {...},
    "paymentDetails": {...}
  }'

# Test settlement endpoint directly
curl -X POST http://localhost:3003/settle \
  -H "Content-Type: application/json" \
  -d '{
    "paymentPayload": {...},
    "paymentDetails": {...}
  }'

# Health check
curl http://localhost:3003/health
```

## References

- [X402 Protocol Specification](https://x402.gitbook.io/x402)
- [Facilitator Concept Documentation](https://x402.gitbook.io/x402/core-concepts/facilitator)
- [HTTP 402 Payment Required](https://x402.gitbook.io/x402/core-concepts/http-402)