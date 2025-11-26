# Security policy

## Supported use

x402 is an experimental payment toolkit. The examples should be evaluated with testnet assets and disposable credentials. No component should be assumed audited or suitable for custody of production funds.

## Reporting

Report vulnerabilities privately through GitHub security advisories when available. Include the affected component, reproduction steps, potential financial impact, and a suggested mitigation. Do not publish secrets or an active exploit in a public issue.

## Deployment checklist

- Verify the payment network, token contract, amount, recipient, and expiration server-side.
- Enforce spending limits independently of client-supplied state.
- Store signing material outside source control and rotate exposed credentials immediately.
- Pin and review dependencies, then resolve relevant audit findings.
- Add replay protection, idempotency, structured audit logs, and rate limits.
- Obtain an independent review before accepting real funds.
