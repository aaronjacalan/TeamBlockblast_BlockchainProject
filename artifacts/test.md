# Manual Testing Guide — Settle Up Transaction

## What to Test
Test the "Settle Up" button to send testnet ADA from your wallet to another address on the Cardano testnet.

## Prerequisites
- Wallet connected and logged in (you are on the Dashboard)
- Testnet ADA (tADA) in your wallet
- Both servers running (frontend on 5173, backend on 8000)

## Step 1: Go to a Group

1. From the **Dashboard**, click on any group card (e.g., "Ski Trip 2024").
2. This opens the **Group Details** page.

## Step 2: Click "Settle Up"

1. In the top right corner, click the **Settle Up** button.
2. A modal will appear.

## Step 3: Fill In the Modal

- **Recipient Address:** Paste a testnet address — your own address, a friend's, or this dummy:
  `addr_test1qpe068rccw5k3vpsnukw5cweff7pxn94sct4edrn2w8e4ccaqcqqy23smyx50j0w7q3j9qgq8cxw7p0v0pqqpqqq9r7tww`
- **Amount:** Enter a small amount like `2` or `5.5` (ADA).

## Step 4: Sign and Send

1. Click **Sign & Send**.
2. Your wallet extension will pop up — review the transaction summary (ADA + network fee).
3. Type your password to sign.
4. The app will show an alert: **"Transaction successful!"** with a **Transaction Hash**.

## Step 5: Verify on Explorer

1. Copy the transaction hash.
2. Go to [Cardanoscan Preview Explorer](https://preview.cardanoscan.io/).
3. Paste the hash in the search bar.
4. Confirm the transaction appears on the blockchain.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `signData` fails | Wallet may not support CIP. Try Lace wallet on Preview network |
| Wallet connects but no redirect | Backend may be down — check uvicorn terminal on port 8000 |
| Groups not loading | Check `backend/.env` has valid Supabase credentials |