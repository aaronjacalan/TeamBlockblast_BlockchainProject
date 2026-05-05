# FairShare 💜

A minimalist Splitwise-like expense splitting app built on the **Cardano blockchain**.  
Create groups, add shared expenses, and automatically split costs — all powered by Web3.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React + TypeScript + Vite         |
| Backend    | Python                            |
| Blockchain | Cardano                           |
| API        | Blockfrost                        |

---

## Team

| Name       | Role                              |
|------------|-----------------------------------|
| Aaron      | Frontend – UI/UX                  |
| Lovely     | Frontend – UI/UX                  |
| Christian  | Backend – Wallet Connection       |
| Zendy      | Backend – Wallet Transactions     |
| Jairus     | Technical Support & Integration   |

---

## Features

- Connect Cardano wallet to identify users
- Create groups and invite members
- Add, edit, or remove shared expenses
- Automatically calculates total and splits cost among members
- Settle payments via Cardano blockchain transactions

---

## Project Structure

```
TeamBlockblast_BlockchainProject/
├── frontend/         # React + Vite app
├── backend/          # Python API server
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or later
- [Python](https://www.python.org/) v3.10 or later
- [pip](https://pip.pypa.io/en/stable/)
- A Blockfrost API key → [blockfrost.io](https://blockfrost.io)

---

### Running the Frontend

```bash
# 1. Go to the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The app will be available at: `http://localhost:5173`

---

### Running the Backend

```bash
# 1. Go to the backend folder
cd backend

# 2. (Optional but recommended) Create a virtual environment
python -m venv venv

# Activate it:
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up your environment variables
# Create a .env file in the backend folder:
cp .env.example .env
# Then open .env and add your Blockfrost API key

# 5. Run the backend server
python main.py
```

The backend will be available at: `http://localhost:8000`

---

### Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
BLOCKFROST_API_KEY=your_blockfrost_api_key_here
NETWORK=testnet
```

> ⚠️ Never commit your `.env` file to GitHub. It's already in `.gitignore`.

---

## Running Both Together

Open **two terminals** side by side:

**Terminal 1 – Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 2 – Backend:**
```bash
cd backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

---
## License

This project is for academic purposes only.

