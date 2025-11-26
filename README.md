# x402 Payment Toolkit

A TypeScript toolkit and set of demonstrations for HTTP `402 Payment Required` flows with blockchain settlement. The repository includes an SDK, a facilitator workflow, and a paid-API game example targeting Somnia and other configured EVM networks.

> **Status:** experimental. Use testnet funds while evaluating the examples, review transaction details before signing, and complete an independent security review before production deployment.

## Components

| Component | Purpose |
| --- | --- |
| [`sdk/`](sdk/Readme.md) | TypeScript SDK, wallet management, payment protocol, tests, and React demo |
| [`facilitator-demo/`](facilitator-demo/README.md) | End-to-end resource server, facilitator, client, and browser interface |
| [`minigame-example/`](minigame-example/README.md) | Treasure-hunt demo with paid API access on Somnia testnet |

## How the flow works

1. A client requests a protected resource.
2. The resource server responds with HTTP 402 and payment requirements.
3. The client validates the request and submits payment through a configured wallet or facilitator.
4. The resource server verifies the payment proof and returns the protected resource.

## Quick start

Requirements: Node.js 18+ and npm.

### Build and test the SDK

```bash
cd sdk
npm ci
npm test -- --runInBand
npm run build:sdk
```

The repository currently includes 64 SDK tests covering network configuration, wallet management, and the primary SDK interface.

### Run the facilitator demo

```bash
cd facilitator-demo
node scripts/setup.js
node scripts/start-all.js
```

### Run the minigame

```bash
cd minigame-example
npm install
npm start
```

Copy the relevant `.env.example` before configuring a demo. Never commit private keys or funded-wallet credentials.

## Documentation

- [SDK guide](sdk/Readme.md)
- [Facilitator setup](sdk/FACILITATOR_SETUP.md)
- [Facilitator API](facilitator-demo/docs/FACILITATOR_API.md)
- [Payment workflow](facilitator-demo/docs/WORKFLOW.md)
- [Minigame tutorial](minigame-example/README.md)

## Verification status

The SDK test suite and Rollup build pass from a clean install. Dependency installation currently reports known audit findings; review and resolve them before treating this as production infrastructure.

## Contributing

Keep pull requests focused and include tests for payment validation, spending limits, network configuration, or wallet behaviour when those areas change.

## License

Individual packages currently declare their own licenses. Check the relevant package metadata before reuse; the repository does not yet contain a root license file.
