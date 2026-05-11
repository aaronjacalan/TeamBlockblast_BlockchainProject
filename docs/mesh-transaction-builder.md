# Mesh Transaction Builder

## Overview

`MeshTxBuilder` is a chainable low-level API for constructing Cardano transactions with automatic UTXO selection and fee calculation. Used for the "settle up" feature where users send ADA to settle debts.

```typescript
import { MeshTxBuilder, BlockfrostProvider } from "@meshsdk/core";
```

## Setup

```typescript
const provider = new BlockfrostProvider("<API_KEY>");
const txBuilder = new MeshTxBuilder({
  fetcher: provider,      // Required for auto-fetching UTXO data
  submitter: provider,    // For direct submission
  evaluator: provider,    // For Plutus script evaluation
  verbose: true,          // Debug logging
});
```

### Options

| Option | Type | Required | Description |
|---|---|---|---|
| `fetcher` | `IFetcher` | Recommended | Provider for fetching chain data |
| `submitter` | `ISubmitter` | No | For direct submission |
| `evaluator` | `IEvaluator` | No | Script execution unit eval |
| `serializer` | `IMeshTxSerializer` | No | Custom serializer |
| `params` | `Partial<Protocol>` | No | Custom protocol params |
| `isHydra` | `boolean` | No | Hydra parameters |
| `verbose` | `boolean` | No | Detailed logging |

## Basic ADA transfer

```typescript
const utxos = await wallet.getUtxosMesh();
const changeAddress = await wallet.getChangeAddressBech32();

const unsignedTx = await txBuilder
  .txOut(recipientAddress, [{ unit: "lovelace", quantity: "5000000" }])  // 5 ADA
  .changeAddress(changeAddress)
  .selectUtxosFrom(utxos)
  .complete();

const signedTx = await wallet.signTx(unsignedTx);
const txHash = await wallet.submitTx(signedTx);
```

## Multi-output

```typescript
const unsignedTx = await txBuilder
  .txOut("addr1...", [{ unit: "lovelace", quantity: "5000000" }])
  .txOut("addr1...", [{ unit: "lovelace", quantity: "3000000" }])
  .changeAddress(changeAddress)
  .selectUtxosFrom(utxos)
  .complete();
```

## Include native assets

```typescript
const unsignedTx = await txBuilder
  .txOut(recipientAddress, [
    { unit: "lovelace", quantity: "2000000" },
    { unit: "policyId...assetNameHex", quantity: "1" }
  ])
  .changeAddress(changeAddress)
  .selectUtxosFrom(utxos)
  .complete();
```

## UTXO selection strategies

```typescript
txBuilder.selectUtxosFrom(
  utxos,
  "largestFirst",       // Strategy
  "5000000",            // Min threshold (lovelace)
  true                  // Include tx fees in calculation
);
```

| Strategy | Description |
|---|---|
| `experimental` | Mesh's optimized algorithm |
| `keepRelevant` | Prefer UTXOs with relevant assets |
| `largestFirst` | Largest UTXOs first |
| `largestFirstMultiAsset` | Optimized for multi-asset txs |

Or manual input:
```typescript
txBuilder.txIn(txHash, outputIndex, amount, address);
```

## Transaction metadata

```typescript
// Add message (CIP-20, label 674)
const unsignedTx = await txBuilder
  .txOut(recipientAddress, [{ unit: "lovelace", quantity: "5000000" }])
  .metadataValue(674, {
    msg: ["Settled expense: Dinner at Mario's"]
  })
  .changeAddress(changeAddress)
  .selectUtxosFrom(utxos)
  .complete();

// Custom metadata
.metadataValue(customLabel, { key: "value" })
```

## Validity & timing

```typescript
import { resolveSlotNo } from "@meshsdk/core";

// Expire in 5 minutes
const slot = resolveSlotNo("preprod", Date.now() + 5 * 60 * 1000);
txBuilder.invalidHereafter(Number(slot));

// Not valid before 10 minutes from now
const startSlot = resolveSlotNo("preprod", Date.now() + 10 * 60 * 1000);
txBuilder.invalidBefore(Number(startSlot));
```

## Fee control

```typescript
// Manual fee
txBuilder.setFee("200000");  // 0.2 ADA in lovelace

// Or omit for automatic calculation
```

## Network config

```typescript
txBuilder.setNetwork("preprod"); // mainnet, testnet, preview, preprod
```

## Multi-signature

```typescript
// Each signer calls signTx with partialSign: true
const witness1 = await wallet1.signTx(unsignedTx, true);
const witness2 = await wallet2.signTx(witness1, true);
// Last signer can use partialSign: false for final tx
const signedTx = await wallet3.signTx(witness2, false);
const txHash = await wallet3.submitTx(signedTx);
```

## Full example (settle-up pattern)

```typescript
import { MeshTxBuilder, BlockfrostProvider } from "@meshsdk/core";
import { MeshCardanoBrowserWallet } from "@meshsdk/wallet";

const provider = new BlockfrostProvider(import.meta.env.VITE_BLOCKFROST_API_KEY);
const wallet = await MeshCardanoBrowserWallet.enable("eternl");

const txBuilder = new MeshTxBuilder({ fetcher: provider, verbose: true });
const utxos = await wallet.getUtxosMesh();
const changeAddress = await wallet.getChangeAddressBech32();

const amountLovelace = Math.floor(amountAda * 1_000_000).toString();

const unsignedTx = await txBuilder
  .txOut(recipientAddress, [{ unit: "lovelace", quantity: amountLovelace }])
  .metadataValue(674, { msg: [`Settled ${amountAda} ADA in group XYZ`] })
  .changeAddress(changeAddress)
  .selectUtxosFrom(utxos, "largestFirst")
  .complete();

const signedTx = await wallet.signTxReturnFullTx(unsignedTx, false);
const txHash = await wallet.submitTx(signedTx);

// Wait for confirmation
provider.onTxConfirmed(txHash, () => {
  console.log(`Transaction confirmed: ${txHash}`);
});
```

## Troubleshooting

| Error | Likely cause | Fix |
|---|---|---|
| "Insufficient funds" | UTXOs don't cover outputs + fees | Check UTXOs total, include min ADA per output (~1.5 ADA) |
| "Missing input" | No fetcher configured | Pass `fetcher: provider` to `MeshTxBuilder` |
| Tx too large | Too many outputs | Split into multiple tx's or consolidate UTXOs first |
| Invalid slot | Wrong network in `resolveSlotNo` | Match network param to actual chain |
