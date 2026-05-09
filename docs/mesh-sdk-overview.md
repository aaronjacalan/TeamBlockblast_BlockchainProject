# Mesh SDK Overview

## What is Mesh?

Mesh is an open-source TypeScript SDK for building Cardano dApps. It provides wallet connectors, a transaction builder, React components, and blockchain providers in a tree-shakeable bundle under 60 kB.

## Package Architecture

This project uses three Mesh packages (all installed as dependencies):

| Package | Install path | Purpose |
|---|---|---|
| `@meshsdk/core` | `dependencies` | `BlockfrostProvider`, transaction types, utilities |
| `@meshsdk/react` | `dependencies` | `MeshProvider`, `useWallet` hook, `<CardanoWallet />` |
| `@meshsdk/wallet` | `dependencies` | `MeshCardanoBrowserWallet` — CIP-30 wallet discovery & enable |

## Version notes

All three are beta releases:
- `@meshsdk/core` ^1.9.0-beta.102
- `@meshsdk/react` ^2.0.0-beta.2
- `@meshsdk/wallet` ^2.0.0-beta.9

Breaking changes are possible between beta versions. Pin versions in `package.json`.

## Import patterns

```typescript
// Blockfrost provider (from core)
import { BlockfrostProvider } from "@meshsdk/core";

// React components and hooks (from react)
import { MeshProvider, useWallet, CardanoWallet } from "@meshsdk/react";

// Browser wallet (from wallet)
import { MeshCardanoBrowserWallet } from "@meshsdk/wallet";
```

## Vite compatibility

Mesh relies on WASM and Node.js polyfills. Three Vite plugins are required:

| Plugin | Reason |
|---|---|
| `vite-plugin-wasm` | WASM module support for serialization |
| `vite-plugin-top-level-await` | WASM initialization pattern |
| `vite-plugin-node-polyfills` | Node globals (Buffer, process) needed by Mesh crypto |

Additional Vite config needed:
```typescript
define: { global: 'globalThis' }
```

Removing any of these breaks module resolution at build time.

## Key concepts

- **Provider** — A blockchain data source (`BlockfrostProvider`, `KoiosProvider`, etc.). Implements `IFetcher` and `ISubmitter`.
- **Browser Wallet** — A CIP-30 compliant wallet extension (Eternl, Nami, Lace, etc.). Accessed via `MeshCardanoBrowserWallet`.
- **Transaction Builder** — `MeshTxBuilder` for constructing Cardano transactions with automatic UTXO selection, fee calculation, and Plutus script support.
- **Signing** — Wallets sign transactions (`signTx`) or arbitrary data (`signData` via CIP-8).
