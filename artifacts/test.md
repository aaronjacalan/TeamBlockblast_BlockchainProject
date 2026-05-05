# Manual Testing Guide — Settle Up Transaction

This guide walks through testing the Cardano testnet transaction flow ("Settle Up") end-to-end.

## Prerequisites

1. **Cardano Wallet Extension** installed (Lace, Nami, or Eternl)
2. **Node.js** v18+ and **Python** v3.10+
3. **Blockfrost API Key** (already in `frontend/.env`)
4. **Supabase Project** with `users` and `groups` tables

## Step 1: Prepare Your Wallet for Testnet

1. Open your Cardano wallet extension.
2. Switch network from **Mainnet** to **Preview** or **Preprod** (must match your Blockfrost API key).
3. Copy your wallet's receive address.

## Step 2: Get Free Testnet ADA (tADA)

> **Important:** Real ADA cannot be used on testnet.

1. Go to [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/).
2. Select the same network as your wallet (Preview/Preprod).
3. Paste your wallet address and request funds.
4. Wait 1–2 minutes for tADA to arrive.

## Step 3: Configure Backend Environment

Ensure `backend/.env` exists with:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-or-service-key
```

## Step 4: Start Both Servers

**Terminal 1 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`.

**Terminal 2 — Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Runs at `http://localhost:8000`.

> **Note:** If you get `ModuleNotFoundError: No module named 'supabase'`, make sure you activated the virtual environment (`source venv/bin/activate`) before running `pip install`.

## Step 5: Log In to the App

1. Open `http://localhost:5173`.
2. Click **Get Started** → select your wallet → **Connect Wallet**.
3. Approve the connection in your wallet extension.
4. The app will save your wallet address to the backend and redirect to the **Dashboard**.

> **Troubleshooting:** If you see a `CORS` error or the page doesn't redirect, check that:
> - The backend server is actually running (`uvicorn` should show `Application startup complete`)
> - Your Supabase `users` table has a `wallet_address` column (text type)
> - Check the browser console for the exact error message

## Step 6: Access Group Details

1. From the Dashboard, click on a group card to open **Group Details**.
2. The page will fetch real group data and expenses from the backend API.

## Step 7: Test "Settle Up" Transaction

1. In the top right corner of the group page, click **Settle Up**.
2. Fill in the modal:
   - **Recipient Address:** Enter a valid testnet address. If you don't have a second wallet, send it back to yourself (paste your own address) or use this dummy Preprod address:
     `addr_test1qpe068rccw5k3vpsnukw5cweff7pxn94sct4edrn2w8e4ccaqcqqy23smyx50j0w7q3j9qgq8cxw7p0v0pqqpqqq9r7tww`
   - **Amount:** Enter a small amount like `2` or `5.5` (ADA).
3. Click **Sign & Send**.

## Step 8: Sign and Verify!

1. Your wallet extension will pop up showing a transaction summary (e.g., sending 5 ADA + network fee).
2. Type your wallet password to sign the transaction.
3. Once submitted, the app will show an alert box saying **"Transaction successful!"** along with a long **Transaction Hash**.
4. Copy that hash and go to [Cardanoscan Testnet Explorer](https://preprod.cardanoscan.io/) (make sure you're on the Preprod/Preview explorer, not Mainnet).
5. Paste the hash in the search bar. You will see your transaction confirming live on the blockchain!

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'supabase'` | Activate venv: `source venv/bin/activate` then `pip install -r requirements.txt` |
| `externally-managed-environment` | Use a virtual environment (`python3 -m venv venv`) instead of system pip |
| `CORS policy` error in browser | Backend is down or crashed. Check terminal for 500 errors |
| `column users.wallet_address does not exist` | Add `wallet_address` column (text type) to Supabase `users` table |
| Wallet connects but no redirect | Check browser console for fetch errors. Backend must be running and accessible |
| Build fails with `noUnusedLocals` | Remove unused imports (e.g., `CURRENCY` from `../data`) |
