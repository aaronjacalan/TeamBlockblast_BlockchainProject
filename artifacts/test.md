Here is a step-by-step guide on how you can manually test and verify that the "Settle Up" transaction functionality is working on the Cardano Testnet.

### Step 1: Prepare Your Wallet for Testnet
1. Open your Cardano browser wallet extension (e.g., Nami, Eternl, or Lace).
2. Go into the wallet's **Settings** and switch the network from "Mainnet" to **"Preprod"** or **"Preview"** (matching whichever network your Blockfrost API key is for).
3. Copy your wallet's receive address.

### Step 2: Get Free Testnet ADA (tADA)
*Real ADA cannot be used on the testnet.*
1. Go to the [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/).
2. Select your network (Preprod or Preview).
3. Paste your wallet address and request funds. The tADA should arrive in your wallet within a minute or two.

### Step 3: Run Both Servers
Because your login page tries to save your wallet address to the database, **both** your frontend and backend must be running.
1. **Frontend:** (I see you already have `npm run dev` running on `localhost:5173`).
2. **Backend:** Open a second terminal, navigate to your `backend/` folder, and run:
   ```bash
   uvicorn main:app --reload
   ```

### Step 4: Login to the App
1. Open `http://localhost:5173` in your browser.
2. Click **Get Started** to go to the Login page.
3. Select your wallet from the dropdown (e.g., Nami) and click **Connect Wallet**.
4. Your wallet extension should pop up asking for access. Click **Approve/Connect**.
5. The app will fetch your address, save it to the backend, and redirect you to the Dashboard.

### Step 5: Test the "Settle Up" Transaction
1. From the Dashboard, click on the **"Ski Trip 2024"** group (or any group) to open the Group Details page.
2. In the top right corner, click the **Settle Up** button. A modal will pop up.
3. **Recipient Address:** Enter a valid testnet address. If you don't have a second wallet to send to, you can send it back to yourself (paste your own address) or use this dummy Preprod address:
   `addr_test1qpe068rccw5k3vpsnukw5cweff7pxn94sct4edrn2w8e4ccaqcqqy23smyx50j0w7q3j9qgq8cxw7p0v0pqqpqqq9r7tww`
4. **Amount:** Enter a small amount like `2` or `5.5` (ADA).
5. Click **Sign & Send**.

### Step 6: Sign and Verify!
1. Your wallet extension will pop up again, showing you a transaction summary (e.g., sending 5 ADA + network fee).
2. Type in your wallet password to sign the transaction.
3. Once submitted, the app will show an alert box saying **"Transaction successful!"** along with a long **Transaction Hash**.
4. Copy that hash and go to [Cardanoscan Testnet Explorer](https://preprod.cardanoscan.io/) (Make sure you are on the Preprod/Preview explorer, not Mainnet).
5. Paste the hash in the search bar. You will see your transaction confirming live on the blockchain!