# FairShare

FairShare is a web application for tracking shared expenses within groups, with payments settled directly through the Cardano blockchain. Rather than relying on traditional account systems, users authenticate via their Cardano wallet, making each wallet address their unique identity within the platform. Expenses are recorded off-chain for efficiency, while settlements are executed as real ADA transactions between wallets, eliminating the need for banks, third-party payment processors, or intermediaries of any kind.

## How It Works

Users authenticate by connecting their Cardano wallet, which serves as their persistent identity across all groups and sessions. This means there are no usernames, passwords, or email addresses to manage. The wallet also authorizes all sensitive actions within the application, ensuring that only the rightful owner can approve expenses, initiate payments, or confirm settlements.

When a bill is split and a balance is due, payments are sent as actual ADA transactions directly between participant wallets and recorded on the Cardano blockchain. Expense records are stored off-chain to keep the application fast and cost-efficient, while the payment layer remains fully on-chain for transparency and auditability.

## Key Features

- **Wallet-Based Authentication** — Users connect via their Cardano wallet. No username or password is required; the wallet address serves as the unique identifier across all groups.
- **Group Expense Tracking** — Create groups, log shared expenses, and assign participants. The application maintains a running ledger of who paid for what.
- **Automatic Debt Calculation** — FairShare automatically computes net balances across all expenses, clearly presenting who owes whom and how much.
- **ADA Payment Integration** — Settlements are made as direct ADA transfers between wallets. Payments are real blockchain transactions, not internal ledger entries.
- **Payment Status Tracking** — Each balance is marked as paid or unpaid, giving all group members a clear view of outstanding and resolved obligations.
- **Transaction History** — A full history of recorded expenses and payments is accessible within the application for reference and verification.

## Running Locally

**Prerequisites:** Node.js and npm must be installed on your machine.

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (required on first run or after cloning):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```