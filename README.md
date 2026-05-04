# FairShare

FairShare is a web application that helps groups track shared expenses and calculate how much each person owes. Instead of traditional accounts, users log in using their Cardano crypto wallet, making the wallet address their unique identity. Expenses are recorded off-chain, while payments happen directly through ADA transactions between wallets, removing intermediaries.

## What It Does

A web application that helps a group of users track shared expenses and calculate how much each person owes.
Instead of using accounts with emails, users log in using their crypto wallet on Cardano, making each wallet address their unique identity.
The app records expenses off-chain, while payments are done directly through ADA transactions between wallets. This removes the need for intermediaries like banks or third-party apps.

## Key Features

- Wallet-based login (no username/password)
- Group expense tracking
- Automatic debt calculation (who owes who)
- ADA payment integration (manual transfer)
- Payment status tracking (paid/unpaid)
- Transaction history viewer

## Run Locally

1. Navigate to the frontend folder:
```bash
cd frontend
```
2. Install dependencies (first time or after cloning):
```bash
cd npm install
```
3. Start the dev server:
   `npm run dev`
```bash
npm run dev
```