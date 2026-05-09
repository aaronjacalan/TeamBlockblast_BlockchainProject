# Mesh Browser Wallet (CIP-30)

## Overview

`MeshCardanoBrowserWallet` connects dApps to CIP-30 compliant browser extension wallets (Eternl, Nami, Lace, Flint, Typhon, GeroWallet, etc.).

Import from `@meshsdk/wallet`:

```typescript
import { MeshCardanoBrowserWallet } from "@meshsdk/wallet";
```

## Wallet Discovery

### getInstalledWallets()

Static method. Returns all CIP-30 wallets installed in the browser.

```typescript
const wallets = MeshCardanoBrowserWallet.getInstalledWallets();
```

**Returns:**
```typescript
[
  { id: "eternl", name: "Eternl", icon: "data:image/png;base64,...", version: "0.1.0" },
  { id: "nami", name: "Nami", icon: "data:image/png;base64,...", version: "3.0.0" }
]
```

## Connection

### enable(walletName, extensions?)

Static method. Prompts the user to grant permission.

```typescript
const wallet = await MeshCardanoBrowserWallet.enable("eternl");

// With CIP extensions
const wallet = await MeshCardanoBrowserWallet.enable("eternl", [{ cip: 95 }]);
```

| Param | Type | Required | Description |
|---|---|---|---|
| `walletName` | `string` | Yes | Wallet ID from `getInstalledWallets()` |
| `extensions` | `Extension[]` | No | e.g., `[{ cip: 95 }]` for governance |

## Account Information

| Method | Returns | Description |
|---|---|---|
| `getNetworkId()` | `Promise<number>` | `0` = testnet, `1` = mainnet |
| `getChangeAddress()` | `Promise<string>` | Change address (hex) |
| `getChangeAddressBech32()` | `Promise<string>` | Change address (Bech32) |
| `getUsedAddresses()` | `Promise<string[]>` | Addresses that received funds (hex) |
| `getUsedAddressesBech32()` | `Promise<string[]>` | Same in Bech32 |
| `getUnusedAddressesBech32()` | `Promise<string[]>` | Addresses never used (Bech32) |
| `getRewardAddresses()` | `Promise<string[]>` | Stake addresses (hex) |
| `getRewardAddressesBech32()` | `Promise<string[]>` | Stake addresses (Bech32) |

This project uses `getRewardAddresses()` to get the user's stake address for auth:
```typescript
const rewardAddresses = await wallet.getRewardAddresses();
const stakeAddress = rewardAddresses[0];
```

## Balance & UTXOs

| Method | Returns | Description |
|---|---|---|
| `getBalance()` | `Promise<string>` | Balance in CBOR hex |
| `getBalanceMesh()` | `Promise<Asset[]>` | Balance as `[{ unit, quantity }]` |
| `getUtxos()` | `Promise<string[]>` | UTXOs in CBOR hex |
| `getUtxosMesh()` | `Promise<UTxO[]>` | UTXOs in Mesh format |
| `getCollateral()` | `Promise<string[]>` | Collateral UTXOs in CBOR hex |
| `getCollateralMesh()` | `Promise<UTxO[]>` | Collateral UTXOs in Mesh format |

`Asset` type:
```typescript
type Asset = { unit: string; quantity: string };
// unit = "lovelace" for ADA, or policyId + hex name for native tokens
```

## Signing & Submission

### signData(address, payload) — used in auth

Sign arbitrary data using CIP-8. Used in this project for wallet-based authentication.

```typescript
const signature = await wallet.signData(stakeAddress, nonce);
```

**Returns:**
```typescript
{
  signature: "845846a2012...",
  key: "a4010103272006215..."
}
```

The returned object has `signature` and `key` fields and should be JSON-serialized when sending to the server.

### signTx(tx, partialSign)

Sign a transaction CBOR. Returns witness set.

```typescript
const witnessSet = await wallet.signTx(unsignedTx, false);   // single signer
const witnessSet = await wallet.signTx(unsignedTx, true);    // multi-sig partial
```

### signTxReturnFullTx(tx, partialSign)

Sign and return full transaction CBOR with witnesses merged.

```typescript
const signedTx = await wallet.signTxReturnFullTx(unsignedTx, false);
```

### submitTx(tx)

Submit a signed transaction to the network. Returns tx hash.

```typescript
const txHash = await wallet.submitTx(signedTx);
// "f4ec9833a3bf95403d395f699bc564938f3419537e7fb5084425d3838a4b6159"
```

## Complete method reference

| Method | Returns | Description |
|---|---|---|
| `getInstalledWallets()` | `Wallet[]` | Static — list installed wallets |
| `enable(walletName, ext?)` | `Promise<MeshCardanoBrowserWallet>` | Static — connect to wallet |
| `getNetworkId()` | `Promise<number>` | 0=testnet, 1=mainnet |
| `getUtxos()` | `Promise<string[]>` | UTXOs in CBOR hex |
| `getUtxosMesh()` | `Promise<UTxO[]>` | UTXOs in Mesh format |
| `getCollateral()` | `Promise<string[]>` | Collateral UTXOs in CBOR hex |
| `getCollateralMesh()` | `Promise<UTxO[]>` | Collateral in Mesh format |
| `getBalance()` | `Promise<string>` | CBOR hex balance |
| `getBalanceMesh()` | `Promise<Asset[]>` | Balance as Asset[] |
| `getUsedAddresses()` | `Promise<string[]>` | Used addrs (hex) |
| `getUsedAddressesBech32()` | `Promise<string[]>` | Used addrs (Bech32) |
| `getUnusedAddressesBech32()` | `Promise<string[]>` | Unused addrs (Bech32) |
| `getChangeAddress()` | `Promise<string>` | Change addr (hex) |
| `getChangeAddressBech32()` | `Promise<string>` | Change addr (Bech32) |
| `getRewardAddresses()` | `Promise<string[]>` | Stake addrs (hex) |
| `getRewardAddressesBech32()` | `Promise<string[]>` | Stake addrs (Bech32) |
| `signTx(tx, partialSign)` | `Promise<string>` | Sign tx, return witness |
| `signTxReturnFullTx(tx, partialSign)` | `Promise<string>` | Sign, return full tx |
| `signData(address, data)` | `Promise<DataSignature>` | Sign arbitrary data (CIP-8) |
| `submitTx(tx)` | `Promise<string>` | Submit signed tx |

## Error handling

```typescript
try {
  const wallet = await MeshCardanoBrowserWallet.enable("eternl");
} catch (error) {
  if (error.message.includes("rejected")) {
    // User declined the prompt
  }
}
```
