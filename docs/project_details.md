markdown_content = """# BLOCKBLAST Project Proposal

**GROUP:** BLOCKBLAST

**Members:**
* Dy, Zendy Mariel L.
* Espina, Ruhmer Jairus R.
* Jacalan, Aaron Rey A.
* Nemeño, Christian A.
* Ong, Lovely Shane P.

---

**dApp Name / Title:** Expense Splitter

**dApp description / usecase:**
* A web application that helps a group of users track shared expenses and calculate how much each person owes.
* Instead of using accounts with emails, users log in using their crypto wallet on Cardano, making each wallet address their unique identity.
* The app records expenses off-chain, while payments are done directly through ADA transactions between wallets. This removes the need for intermediaries like banks or third-party apps.

**Key Features:**
* Wallet-based login (no username/password)
* Group expense tracking
* Automatic debt calculation (who owes who)
* ADA payment integration (manual transfer)
* Payment status tracking (paid/unpaid)
* Transaction history viewer.
"""

file_path = "expense_splitter_proposal.md"
with open(file_path, "w", encoding="utf-8") as f:
    f.write(markdown_content)

print(f"File generated successfully at {file_path}")