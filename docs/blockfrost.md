# Blockfrost API

## What is Blockfrost?

Blockfrost is an API-as-a-service for the Cardano blockchain. It provides instant access to blockchain data without running your own node. It also serves as an IPFS provider.

Official site: [blockfrost.io](https://blockfrost.io)
API docs: [docs.blockfrost.io](https://docs.blockfrost.io/)

## Setup

1. Create account at [blockfrost.io/auth/signin](https://blockfrost.io/auth/signin) (email or SSO via Google/GitHub)
2. Create a project — select the correct **network**
3. Copy the auto-generated `project_id` (API key)

### Available networks

| Network | ID | Use case |
|---|---|---|
| Mainnet | 1 | Production |
| Preprod | 0 | Testnet — CIP changes, hard forks |
| Preview | 0 | Testnet — lightweight, faster |
| Testnet (legacy) | 0 | Deprecated, use Preprod instead |

This project uses **Preview** (the `.env` key is a `preview...` prefixed key).

### Plans and rate limits

Free tier: limited requests/second. See [plans and billing](https://blockfrost.dev/overview/plans-and-billing).

## Usage in this project

### BlockfrostProvider (from `@meshsdk/core`)

```typescript
// src/utils/provider.ts
import { BlockfrostProvider } from "@meshsdk/core";

const apiKey = import.meta.env.VITE_BLOCKFROST_API_KEY;
export const provider = new BlockfrostProvider(apiKey || "dummy_key_to_prevent_crash");
```

The API key is loaded from `VITE_BLOCKFROST_API_KEY` in `frontend/.env`.

### Custom self-hosted URL

```typescript
const provider = new BlockfrostProvider("https://your-blockfrost-instance.com");
```

## API Reference (Mesh Provider methods)

### fetchAddressUTxOs(address, asset?)

Get all UTXOs controlled by an address. Optionally filter by asset.

```typescript
const utxos = await provider.fetchAddressUTxOs("addr_test1qz...");
const filtered = await provider.fetchAddressUTxOs("addr_test1qz...", "policyId...hexname");
```

### fetchAddressAssets(address)

Get all native assets held at an address.

```typescript
const assets = await provider.fetchAddressAssets("addr_test1qz...");
// [{ unit: "lovelace", quantity: "5000000" }, ...]
```

### fetchAccountInfo(stakeAddress)

Get staking info for a reward address: delegation, rewards, withdrawals.

```typescript
const info = await provider.fetchAccountInfo("stake_test1uz...");
// { active: true, poolId: "pool1...", balance: "1000000", rewards: "50000", withdrawals: "0" }
```

### fetchTxInfo(txHash)

Get confirmed transaction details.

```typescript
const txInfo = await provider.fetchTxInfo("f4ec9833a3bf95403d395f699bc564938f3419537e7fb5084425d3838a4b6159");
```

### fetchUTxOs(txHash, outputIndex?)

Get UTXOs for a specific transaction output.

```typescript
const utxos = await provider.fetchUTxOs("dfd2a2616e6154a092807b1ceebb9ddcadc0f22cf5c8e0e6b0757815083ccb70", 0);
```

### fetchProtocolParameters(epoch?)

Get current protocol parameters. Optionally specify historical epoch.

```typescript
const params = await provider.fetchProtocolParameters();
const histParams = await provider.fetchProtocolParameters(400);
```

### submitTx(tx)

Submit a signed transaction CBOR to the network.

```typescript
const txHash = await provider.submitTx(signedTx);
```

### evaluateTx(tx)

Evaluate execution units for Plutus script transactions. Returns redeemer budgets.

```typescript
const evaluation = await provider.evaluateTx(unsignedTx);
// [{ index: 0, tag: "SPEND", budget: { mem: 1700, steps: 368100 } }]
```

### onTxConfirmed(txHash, callback)

Subscribe to confirmation event for a transaction.

```typescript
provider.onTxConfirmed(txHash, () => {
  console.log("Transaction confirmed!");
});
```

### get(endpoint)

Make custom requests to any Blockfrost endpoint.

```typescript
const transactions = await provider.get("/addresses/addr_test1qz.../transactions");
```

### Asset metadata methods

```typescript
const metadata = await provider.fetchAssetMetadata("policyId...hexname");
const addresses = await provider.fetchAssetAddresses("policyId...hexname");
const { assets, next } = await provider.fetchCollectionAssets("policyId", cursor?);
```

### Handle resolution

```typescript
const address = await provider.fetchHandleAddress("meshsdk");
const handleData = await provider.fetchHandle("meshsdk");
```

### Governance

```typescript
const proposal = await provider.fetchGovernanceProposal("txHash", 0);
```

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| 403 / "Project not found" | Wrong API key or network | Verify key at blockfrost.io/dashboard |
| 429 / Rate limit exceeded | Free tier limit | Add caching, upgrade plan, or throttle |
| "Transaction submit error" | Bad tx structure or spent UTXOs | Refresh UTXOs, check funds |
| Slow responses | No caching, large queries | Filter by asset, cache protocol params, consider self-hosting |
