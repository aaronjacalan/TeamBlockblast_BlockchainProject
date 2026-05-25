# FairShare ⬡ 

A premium, interactive, and fully decentralized group expense splitting application built on the **Cardano Blockchain** with robust Web3 security, on-chain metadata protection, and stunning modern aesthetics.

---

## ⚡ Core Features

- **Modern Glassmorphic UI**: Elegant, highly polished visual elements using curated HSL color palettes, fluid layout transitions, responsive cards, and a custom interactive glassmorphic toast notification system.
- **Cardano Web3 Authentication**: Ultra-secure, nonce-based signature workflow leveraging standard Cardano browser wallets (e.g. Lace, Eternl, Nami, Vespr) and cryptographically verifying ownership backend.
- **On-Chain Settlement**: Real-time balance calculations, automated multi-party cost splits, and transparent settling of debts directly via Cardano transactions.
- **Group Creation Fee Protection**: Zero-loss transaction verification. If a user pays the group fee and unmounts, FastAPI background workers proactively retry confirmation in the background, allowing the user to resume their group creation via sync/async API endpoints.
- **On-Chain Privacy (SHA-256 Metadata)**: Clientside hashing of transactional details (who, to whom, action, timestamp, group) using standard cryptographic hashes prior to committing them on-chain under CIP-20 standards (label `1999`).
- **Interactive Web3 Analytics Panel**: Live dashboard showing spent statistics, a beautiful SVG fairness ring gauge, and real-time Cardano transaction statistics.

---

## 🛠️ Technology Stack

| Layer | Technologies | Description |
|---|---|---|
| **Frontend** | React 19 + Vite 8 + TypeScript 6 | Highly modular, clean architecture with strict typing. |
| **Styling** | Vanilla CSS + HSL Palettes | Fluid animations, glassmorphic blur backdrops, responsive flexboxes. |
| **Backend** | Python 3.11 + FastAPI + Supabase | Scalable API backend, background tasks, database ledger. |
| **Blockchain** | Cardano + `@meshsdk` (Core, React, Wallet) | Trustless operations, CIP-20 CIP-30 protocols. |

---

## 📁 Project Structure

```text
TeamBlockblast_BlockchainProject/
├── frontend/           # Vite React Web3 application
│   ├── src/
│   │   ├── components/ # Reusable UI components (Header, Footer, Chat items)
│   │   ├── pages/      # Views (Landing, Login, Dashboard, GroupDetails)
│   │   ├── utils/      # Blockchain providers & helper tools
│   │   └── main.tsx    # Application entry wrapping MeshProvider
└── backend/            # FastAPI REST & background processing server
    ├── routers/        # Endpoint routers (auth, groups, expenses)
    ├── database.py     # Supabase client instantiation
    └── main.py         # App entry and CORS middlewares
```

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.0 or later)
- **Python** (v3.10 or later)
- **Supabase Account** (for SQL backend ledger)
- **Cardano Wallet Extension** (e.g., Lace, Nami, Eternl in preprod testnet mode)

---

### 💻 1. Setting Up the Backend

```bash
# Move to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
source venv/bin/activate # For Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your environmental configuration
# Set your SUPABASE_URL, SUPABASE_KEY, etc. in .env
cp .env.example .env

# Start the development server
uvicorn main:app --reload
```
The FastAPI documentation will be interactively available at: **`http://localhost:8000/docs`**

---

### 🎨 2. Setting Up the Frontend

```bash
# Move to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start the Vite local server
npm run dev
```
The web client will be active at: **`http://localhost:5173`**

---

## 🧪 Build and Verification

Ensure code quality, zero unused imports, and strict TypeScript compliance before committing:

```bash
# Run flat ESLint check
npm run lint

# Compile and package for production
npm run build
```

---

## 🔒 Security & Privacy Commitments

1. **Non-Custodial Design**: FairShare never holds your funds. All payments flow peer-to-peer on Cardano.
2. **Zero Exposed Secrets**: No API keys, database credentials, or wallet seed phrases are ever hardcoded in the codebase. All keys are securely managed via backend `.env` variables.
3. **Clientside Privacy-First Hashing**: Private transaction context (such as exact split ratios and specific member names) is fully obscured from public block explorers using clientside cryptographic hashes.

---

## 📄 License

This project is prepared and distributed for academic/auditing purposes only. All rights reserved.
