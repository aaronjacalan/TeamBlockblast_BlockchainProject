# Wallet Auth Flow (Nonce + Signature)

This project uses CIP-8 message signing to authenticate users via their Cardano wallet. No passwords. The stake address becomes the user's identity.

## Flow diagram

```
User               Frontend (Login.tsx)         Backend (routes/auth.py)        Supabase
 │                      │                              │                          │
 │  1. Select wallet    │                              │                          │
 │─────────────────────>│                              │                          │
 │                      │                              │                          │
 │  2. Enable wallet    │                              │                          │
 │  (browser prompt)    │                              │                          │
 │<─────────────────────│                              │                          │
 │                      │                              │                          │
 │                      │  3. POST /api/auth/nonce     │                          │
 │                      │  { stake_address }           │                          │
 │                      │─────────────────────────────>│                          │
 │                      │                              │  4. Upsert user + nonce  │
 │                      │                              │─────────────────────────>│
 │                      │                              │<─────────────────────────│
 │                      │  { nonce }                   │                          │
 │                      │<─────────────────────────────│                          │
 │                      │                              │                          │
 │  5. signData(addr,   │                              │                          │
 │     nonce) (CIP-8)   │                              │                          │
 │<─────────────────────│                              │                          │
 │                      │                              │                          │
 │                      │  6. POST /api/auth/verify    │                          │
 │                      │  { stake_address,            │                          │
 │                      │    signed_message }          │                          │
 │                      │─────────────────────────────>│                          │
 │                      │                              │  7. Lookup user by addr  │
 │                      │                              │─────────────────────────>│
 │                      │                              │<─────────────────────────│
 │                      │                              │                          │
 │                      │                              │  8. Check nonce expiry   │
 │                      │                              │                          │
 │                      │                              │  9. Clear nonce          │
 │                      │                              │     (replay protection)  │
 │                      │                              │─────────────────────────>│
 │                      │                              │                          │
 │                      │  { user: { id,               │                          │
 │                      │      stake_address } }       │                          │
 │                      │<─────────────────────────────│                          │
 │                      │                              │                          │
 │  10. App state       │                              │                          │
 │  updated             │                              │                          │
 │<─────────────────────│                              │                          │
```

## Step-by-step

### 1. Wallet discovery & enable

```typescript
// Login.tsx
const wallets = MeshCardanoBrowserWallet.getInstalledWallets();
const wallet = await MeshCardanoBrowserWallet.enable(selectedWallet);
```

### 2. Get stake address

```typescript
const rewardAddresses = await wallet.getRewardAddresses();
const stakeAddress = rewardAddresses[0];
// e.g., "stake_test1uzw5mnt7g4xjgdqkfa80hrk7kdvds6sa4k0vvgjvlj7w8eskffj2n"
```

### 3. Request nonce from server

```typescript
const nonceRes = await fetch("/api/auth/nonce", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ stake_address: stakeAddress }),
});
const { nonce } = await nonceRes.json();
// nonce = 64-char hex string (secrets.token_hex(32))
```

### 4. Server creates/updates user

```python
# routes/auth.py
existing = supabase.table("users") \
    .select("id") \
    .eq("stake_address", stake_address) \
    .maybe_single() \
    .execute()

if existing is None:
    # Create new user
    supabase.table("users").insert({
        "stake_address": stake_address,
        "auth_nonce": nonce,
        "nonce_expires_at": expires_at.isoformat()
    }).execute()
else:
    # Update existing user's nonce
    supabase.table("users").update({
        "auth_nonce": nonce,
        "nonce_expires_at": expires_at.isoformat()
    }).eq("stake_address", stake_address).execute()
```

Nonce is `secrets.token_hex(32)` with 5-minute expiry.

### 5. Sign nonce with wallet

```typescript
// CIP-8: wallet signs a message, proving ownership of the stake key
const signedMessage = await wallet.signData(stakeAddress, nonce);

// Result is a DataSignature object:
// { signature: "845846a2012...", key: "a4010103272006215..." }
```

Send as JSON-serialized string:
```typescript
const verifyRes = await fetch("/api/auth/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    stake_address: stakeAddress,
    signed_message: JSON.stringify(signedMessage),
  }),
});
```

### 6. Server verifies

The server:
1. Looks up the user by `stake_address`
2. Checks the nonce exists and hasn't expired (5 min TTL)
3. Clears the nonce immediately (replay protection — each nonce can only be used once)
4. Returns user `{ id, stake_address }`

```python
# Simplified verification
user = result.data[0]
expires_at = datetime.fromisoformat(user["nonce_expires_at"])

if datetime.now(timezone.utc) > expires_at:
    raise HTTPException(status_code=400, detail="Nonce expired")

# Clear nonce (one-time use)
supabase.table("users").update({
    "auth_nonce": None,
    "nonce_expires_at": None
}).eq("stake_address", stake_address).execute()
```

**Note**: The current backend does NOT cryptographically verify the signature — it trusts the nonce exchange as proof. For production, use `checkSignature()` from `@meshsdk/core` on the server side to verify the signed message matches the stake address, following the [Prove Wallet Ownership guide](https://meshjs.dev/guides/prove-wallet-ownership).

## Security considerations

| Concern | Mitigation in this project |
|---|---|
| Replay attacks | Nonce cleared after single use |
| Expired nonce | 5-minute TTL, checked server-side |
| Wrong address | Server looks up stake_address from request, does not accept arbitrary addresses |
| Signature verification | **Missing** — current backend does not call `checkSignature()`. The frontend serializes `signData` result but server only checks nonce validity |
| HTTPS | Ensure in production |
| Rate limiting | Not implemented |

## Data model (Supabase `users` table)

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID (auto) | Primary key |
| `stake_address` | text | Unique wallet identity |
| `auth_nonce` | text \| null | Current nonce (null after use) |
| `nonce_expires_at` | timestamptz \| null | Nonce expiration |
| `email` | text \| null | Optional, set in Settings |
| `display_name` | text \| null | Optional, set in Settings |

## Route summary

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/nonce` | Get nonce for a stake address |
| POST | `/api/auth/verify` | Verify signed nonce, return user |
| PUT | `/api/profile` | Update email/display_name |
| GET | `/api/profile?user_id=` | Get user profile |
| GET | `/api/profile/by-email?email=` | Lookup user by email |
