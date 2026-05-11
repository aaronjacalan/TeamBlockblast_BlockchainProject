# Mesh React — Components & Hooks

## MeshProvider

Wraps the app to provide wallet context to all children.

```typescript
import { MeshProvider } from "@meshsdk/react";

<MeshProvider>
  <App />
</MeshProvider>
```

Must be at the root level. Hooks will throw if used outside.

## CardanoWallet

Pre-built wallet connection button.

```typescript
import { CardanoWallet } from "@meshsdk/react";

<CardanoWallet
  label="Connect Wallet"
  isDark={false}
  persist={false}
  onConnected={() => console.log("connected")}
/>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | `"Connect Wallet"` | Button text |
| `isDark` | `boolean` | `false` | Dark mode styling |
| `persist` | `boolean` | `false` | Remember wallet across sessions |
| `onConnected` | `() => void` | `undefined` | Callback after connection |
| `burnerWallet` | `object` | `undefined` | Test wallet config |
| `injectFn` | `() => Promise<void>` | `undefined` | Custom wallet injection |

## useWallet

Primary hook for connection state and wallet access.

```typescript
import { useWallet } from "@meshsdk/react";

const { wallet, connected, connecting, name, state, connect, disconnect, error } = useWallet();
```

### Return values

| Property | Type | Description |
|---|---|---|
| `wallet` | `MeshCardanoBrowserWallet \| null` | Wallet instance (null when disconnected) |
| `connected` | `boolean` | Whether a wallet is connected |
| `connecting` | `boolean` | Connection in progress |
| `name` | `string` | Connected wallet name |
| `state` | `"NOT_CONNECTED" \| "CONNECTING" \| "CONNECTED"` | Connection state enum |
| `connect` | `(walletName: string) => Promise<void>` | Connect to specific wallet |
| `disconnect` | `() => void` | Disconnect |
| `error` | `Error \| null` | Last connection error |

### Usage pattern in this project

This project does NOT use `CardanoWallet` or `useWallet().connect`. Instead it uses `MeshCardanoBrowserWallet.enable()` directly (see `Login.tsx`). The `useWallet()` hook is only used to call `setWallet(wallet, name)` after manual enable, wiring the wallet instance into Mesh's React context for other hooks to consume.

```typescript
// Login.tsx pattern
const { setWallet } = useWallet();
const wallet = await MeshCardanoBrowserWallet.enable(selectedWallet);
setWallet(wallet, selectedWallet);
```

## useWalletList

Returns installed CIP-30 browser wallets.

```typescript
import { useWalletList } from "@meshsdk/react";

const wallets = useWalletList();
// [{ name: "eternl", icon: "data:image/...", version: "0.1.0" }, ...]
```

Param `options.injectFn` for custom wallet injection (e.g., MetaMask Snaps).

## useLovelace

Returns ADA balance in lovelace (1 ADA = 1,000,000 lovelace).

```typescript
import { useLovelace } from "@meshsdk/react";

const lovelace = useLovelace();
// "796105407" string | undefined
const ada = parseInt(lovelace || "0") / 1_000_000;
```

## useAddress

Returns connected wallet's current address.

```typescript
import { useAddress } from "@meshsdk/react";

const address = useAddress(accountId?: number);
// "addr_test1qz..." string | undefined
```

Optional `accountId` parameter for multi-account wallets (default 0).

## useAssets

Returns all assets (ADA + native tokens) from all UTXOs.

```typescript
import { useAssets } from "@meshsdk/react";

const assets = useAssets();
// [{ unit: "lovelace", quantity: "5000000" }, ...] | undefined
```

Filter out ADA: `assets?.filter(a => a.unit !== "lovelace")`

## useNetwork

Returns network ID.

```typescript
import { useNetwork } from "@meshsdk/react";

const network = useNetwork();
// 0 = testnet, 1 = mainnet, undefined = not connected
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Hooks return `undefined` | Ensure `MeshProvider` wraps the tree and check `connected` before reading data |
| `useWalletList` empty | Wallet extensions not installed/enabled; refresh after install |
| Stale balance after tx | Disconnect and reconnect, or refresh after confirmation delay |
| CSS not loaded | Import `@meshsdk/react/styles.css` in `main.tsx` |
