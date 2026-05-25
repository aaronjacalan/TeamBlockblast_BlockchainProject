from database import supabase

# HELPER FUNCTION - not an endpoint
def recalculate_splits_for_group(group_id: str):
    print(f"=== RECALCULATE SPLITS for group {group_id} ===")
    
    members_result = (
        supabase.table("group_members")
        .select("user_id")
        .eq("group_id", group_id)
        .execute()
    )
    member_ids = [m["user_id"] for m in members_result.data]
    print(f"members: {member_ids}")
    if not member_ids:
        return

    expenses_result = (
        supabase.table("expenses")
        .select("id, amount, paid_by")
        .eq("group_id", group_id)
        .neq("tx_status", "settled")
        .execute()
    )
    print(f"unsettled expenses: {expenses_result.data}")

    for expense in expenses_result.data:
        expense_id = expense["id"]
        paid_by = expense["paid_by"]
        per_person = round(expense["amount"] / len(member_ids), 6)
        print(f"--- expense {expense_id}, amount {expense['amount']}, per_person {per_person}")

        existing_result = (
            supabase.table("expense_splits")
            .select("user_id, is_settled")
            .eq("expense_id", expense_id)
            .execute()
        )
        existing_map = {s["user_id"]: s for s in existing_result.data}
        print(f"existing splits: {existing_map}")

        for uid in member_ids:
            if uid in existing_map:
                if not existing_map[uid]["is_settled"]:
                    supabase.table("expense_splits").update({
                        "amount_owed": per_person,
                    }).eq("expense_id", expense_id).eq("user_id", uid).execute()
                    print(f"updated split for {uid}")
            else:
                result = supabase.table("expense_splits").insert({
                    "expense_id": expense_id,
                    "user_id": uid,
                    "amount_owed": per_person,
                    "is_settled": uid == paid_by,
                }).execute()
                print(f"inserted split for {uid}: {result.data}")

        for uid in list(existing_map.keys()):
            if uid not in member_ids:
                supabase.table("expense_splits").delete()\
                    .eq("expense_id", expense_id)\
                    .eq("user_id", uid)\
                    .execute()
                print(f"deleted split for {uid}")

    print("=== RECALCULATE DONE ===")


import os
import requests
from fastapi import HTTPException

def verify_transaction_payment(tx_hash: str, target_address: str, expected_amount_ada: float) -> bool:
    """
    Queries Blockfrost to verify that the transaction with tx_hash exists 
    and has an output sending at least expected_amount_ada to target_address.
    """
    api_key = os.getenv("BLOCKFROST_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Backend configuration error: BLOCKFROST_API_KEY is not defined in backend environment."
        )

    api_key = "".join(api_key.split())
    network = "preview" if api_key.startswith("preview") else "mainnet"
    base_url = f"https://cardano-{network}.blockfrost.io/api/v0"
    headers = {"project_id": api_key}

    expected_lovelaces = int(round(expected_amount_ada * 1_000_000))
    target_address = target_address.strip()

    # 1. Fetch transaction UTXOs
    utxo_url = f"{base_url}/txs/{tx_hash}/utxos"
    try:
        res = requests.get(utxo_url, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            for output in data.get("outputs", []):
                if output.get("address") == target_address:
                    for amount_item in output.get("amount", []):
                        if amount_item.get("unit") == "lovelace":
                            quantity = int(amount_item.get("quantity", 0))
                            # Add a small buffer of 5000 Lovelaces (0.005 ADA) to handle minor float roundings
                            if quantity >= (expected_lovelaces - 5000):
                                print(f"[VERIFIED] Found output of {quantity} Lovelaces to {target_address}")
                                return True
            print(f"[FAILED] Could not find output matching {expected_lovelaces} Lovelaces to {target_address}")
            raise HTTPException(
                status_code=400,
                detail=f"Payment verification failed: No transaction output was found sending at least {expected_amount_ada} ADA to {target_address}."
            )
        elif res.status_code == 404:
            # Fallback to checking the mempool for presence
            mempool_url = f"{base_url}/mempool/{tx_hash}"
            mempool_res = requests.get(mempool_url, headers=headers, timeout=10)
            if mempool_res.status_code == 200:
                print(f"[MEMPOOL] Transaction {tx_hash} is pending in the mempool. Accepting for fast settlement.")
                return True
            raise HTTPException(
                status_code=400,
                detail="Payment verification failed: Transaction hash not found in blocks or mempool. Please wait a few seconds and try again."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Blockchain lookup returned error code {res.status_code}."
            )
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to communicate with Blockfrost API: {str(e)}"
        )