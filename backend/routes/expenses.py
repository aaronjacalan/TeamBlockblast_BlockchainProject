from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import time
from database import supabase
from routes.groups import log_activity
from routes.utils import verify_transaction_payment

router = APIRouter()


class ExpenseCreate(BaseModel):
    group_id: str
    paid_by: str  # user uuid
    name: str
    amount: float
    currency: Optional[str] = "ADA"
    split_type: Optional[str] = "equal"


@router.get("/")
def get_expenses(group_id: str):
    result = (
        supabase.table("expenses")
        .select("*, expense_splits(user_id, amount_owed, is_settled)")
        .eq("group_id", group_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("/")
def create_expense(data: ExpenseCreate):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Expense name is required")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    # verify group exists and paid_by is a member
    member_result = (
        supabase.table("group_members")
        .select("user_id")
        .eq("group_id", data.group_id)
        .execute()
    )
    if not member_result.data:
        raise HTTPException(status_code=404, detail="Group not found or has no members")

    member_ids = [m["user_id"] for m in member_result.data]

    if data.paid_by not in member_ids:
        raise HTTPException(status_code=403, detail="paid_by user is not a member of this group")

    # create expense
    expense_result = supabase.table("expenses").insert({
        "group_id": data.group_id,
        "paid_by": data.paid_by,
        "name": data.name.strip(),
        "amount": data.amount,
        "currency": data.currency,
        "split_type": data.split_type,
        "tx_status": "pending",
    }).execute()

    expense = expense_result.data[0]
    expense_id = expense["id"]

    # create equal splits for all members
    if data.split_type == "equal":
        per_person = round(data.amount / len(member_ids), 6)
        splits = [
            {
                "expense_id": expense_id,
                "user_id": uid,
                "amount_owed": per_person,
                "is_settled": uid == data.paid_by,  # payer's split is already settled
            }
            for uid in member_ids
        ]
        supabase.table("expense_splits").insert(splits).execute()

    log_activity(data.paid_by, data.group_id, "expense_added", f"Added expense \"{data.name}\" — {data.currency} {data.amount}")
    return expense


class SettleRequest(BaseModel):
    group_id: str
    from_user_id: str   # the person who paid (settling their debt)
    to_user_id: str     # the person who was owed
    tx_hash: str
    amount: float


@router.get("/settlements")
def get_settlements(group_id: str):
    result = (
        supabase.table("settlements")
        .select("*, from_user:users!settlements_from_user_fkey(display_name, email, stake_address), to_user:users!settlements_to_user_fkey(display_name, email, stake_address)")
        .eq("group_id", group_id)
        .order("initiated_at", desc=True)
        .execute()
    )
    return result.data


def audit_settlement_background(
    group_id: str,
    from_user_id: str,
    to_user_id: str,
    tx_hash: str,
    expected_amount: float,
    recipient_address: str,
    settlement_id: str,
    optimistic_splits: list
):
    print(f"\n[BACKGROUND AUDIT START] Settlement ID: {settlement_id} (tx: {tx_hash})")
    print(f"  Expecting {expected_amount} ADA to be sent to {recipient_address}")

    # Retry up to 5 times (15 seconds between attempts to allow block propagation)
    verified = False
    for attempt in range(1, 6):
        print(f"  [Attempt {attempt}/5] Verifying transaction on-chain...")
        try:
            if verify_transaction_payment(tx_hash, recipient_address, expected_amount):
                verified = True
                break
        except Exception as e:
            print(f"  [Attempt {attempt}/5] Verification pending/failed: {str(e)}")
            
        # FIX: Sleep on every attempt except the last one (gives 60 seconds total wait time)
        if attempt < 5:
            time.sleep(15)

    if verified:
        print(f"  [BACKGROUND AUDIT SUCCESS] Settlement {settlement_id} verified on-chain!")
        # 1. Update settlement status to confirmed
        supabase.table("settlements").update({"tx_status": "confirmed"}).eq("id", settlement_id).execute()

        # 2. Delete the old "pending verification" notification so it doesn't linger
        try:
            supabase.table("notifications").delete() \
                .eq("user_id", to_user_id) \
                .eq("type", "payment_settled") \
                .eq("metadata->>tx_hash", tx_hash) \
                .execute()
        except Exception as err:
            print(f"Failed to clear pending notification: {err}")

        # 3. Notify the recipient that the payment is confirmed and settled!
        supabase.table("notifications").insert({
            "user_id": to_user_id,
            "type": "payment_confirmed",
            "title": "Payment Verified",
            "message": f"Confirmed! On-chain settlement transaction of {round(expected_amount, 6)} ADA has been verified.",
            "metadata": {
                "group_id": group_id,
                "from_user_id": from_user_id,
                "tx_hash": tx_hash,
                "amount": round(expected_amount, 6),
            }
        }).execute()
    else:
        print(f"  [BACKGROUND AUDIT FAILED] Settlement {settlement_id} FAILED verification after 3 attempts. ROLLING BACK...")
        try:
            # 1. ROLLBACK expense_splits back to unsettled (is_settled: False)
            for split in optimistic_splits:
                supabase.table("expense_splits").update({"is_settled": False}).eq("expense_id", split["expense_id"]).eq("user_id", split["user_id"]).execute()

            # 2. only resets the expenses that were part of this specific settlement
            for exp_id in optimistic_expense_ids:
                supabase.table("expenses").update({"tx_status": "pending"}).eq("id", exp_id).execute()

            # 3. Mark the settlement record as failed in Supabase
            supabase.table("settlements").update({"tx_status": "failed"}).eq("id", settlement_id).execute()

            # 4. Insert a critical warning notification to the recipient in Supabase
            supabase.table("notifications").insert({
                "user_id": to_user_id,
                "type": "payment_failed",
                "title": "Payment Verification Failed",
                "message": f"CRITICAL: Verification failed for settlement transaction of {round(expected_amount, 6)} ADA (tx: {tx_hash[:12]}...). Debt has been rolled back as unpaid.",
                "metadata": {
                    "group_id": group_id,
                    "from_user_id": from_user_id,
                    "tx_hash": tx_hash,
                    "amount": round(expected_amount, 6),
                }
            }).execute()

            # 5. Log rollback activity
            log_activity(
                from_user_id,
                group_id,
                "payment_failed",
                f"Rollback: Settlement {tx_hash[:12]}... failed on-chain verification."
            )
        except Exception as rollback_err:
            print(f"  [CRITICAL ERROR] Rollback operations failed: {rollback_err}")


@router.patch("/settle")
def settle_splits(data: SettleRequest, background_tasks: BackgroundTasks):
    # 1. Fetch recipient's payment address securely on the server
    recipient = supabase.table("users").select("payment_address").eq("id", data.to_user_id).execute()
    if not recipient.data or not recipient.data[0].get("payment_address"):
        raise HTTPException(
            status_code=400,
            detail="Payment verification failed: The recipient user has not set up or connected their payment address."
        )
    recipient_address = recipient.data[0]["payment_address"].strip()

    # Query 1: Expenses paid by data.to_user_id (User A) — where User B (data.from_user_id) owes A money
    expenses_to_user = (
        supabase.table("expenses")
        .select("id, amount")
        .eq("group_id", data.group_id)
        .eq("paid_by", data.to_user_id)
        .execute()
    )
    expense_ids_to_user = [e["id"] for e in expenses_to_user.data] if expenses_to_user.data else []

    # Query 2: Expenses paid by data.from_user_id (User B) — where User A (data.to_user_id) owes B money
    expenses_from_user = (
        supabase.table("expenses")
        .select("id, amount")
        .eq("group_id", data.group_id)
        .eq("paid_by", data.from_user_id)
        .execute()
    )
    expense_ids_from_user = [e["id"] for e in expenses_from_user.data] if expenses_from_user.data else []

    settled_count = 0
    sum_B_owes_A = 0.0
    sum_A_owes_B = 0.0
    optimistic_splits = []
    involved_expense_ids = []

    for expense_id in expense_ids:
        # only settle if from_user owes to_user for this expense
        # (i.e. to_user paid, from_user has unsettled split)
        split_check = (
            supabase.table("expense_splits")
            .select("amount_owed")
            .eq("expense_id", expense_id)
            .eq("user_id", data.from_user_id)
            .eq("is_settled", False)
            .execute()
        )

        if not split_check.data:
            continue  # no debt here, skip

        amount_owed = split_check.data[0]["amount_owed"]
        
        # verify this expense was paid by to_user (not from_user)
        # already guaranteed by the expenses_result query above
        
        total_amount += amount_owed
        settled_count += 1
        optimistic_expense_ids.append(expense_id)
        
        supabase.table("expense_splits").update({"is_settled": True}).eq("expense_id", expense_id).eq("user_id", data.from_user_id).execute()

        # check if all splits for this expense are now settled
        splits = (
            supabase.table("expense_splits")
            .select("is_settled")
            .eq("expense_id", expense_id)
            .execute()
        )
        all_settled = all(s["is_settled"] for s in splits.data) if splits.data else False
        if all_settled:
            supabase.table("expenses").update({
                "tx_status": "settled",
                "tx_hash": data.tx_hash,
            }).eq("id", expense_id).execute()

    print(f"total_amount: {total_net_amount}")
    print(f"settled_count: {settled_count}")

    if settled_count > 0:
        try:
            # 2. Insert settlement record optimistically as "pending"
            insert_result = supabase.table("settlements").insert({
                "group_id": data.group_id,
                "from_user": data.from_user_id,
                "to_user": data.to_user_id,
                "amount": round(data.amount, 6),
                "tx_hash": data.tx_hash,
                "tx_status": "pending",
            }).execute()
            
            settlement_id = insert_result.data[0]["id"]
            
            # 3. Notify the recipient that a payment is pending verification
            supabase.table("notifications").insert({
                "user_id": data.to_user_id,
                "type": "payment_settled",
                "title": "Payment Pending Verification",
                "message": f"You received ADA {round(data.amount, 6)} — pending verification (tx: {data.tx_hash[:12]}...)",
                "metadata": {
                    "group_id": data.group_id,
                    "from_user_id": data.from_user_id,
                    "tx_hash": data.tx_hash,
                    "amount": total_net_amount,
                }
            }).execute()

            # 4. Schedule the asynchronous background on-chain validation audit task
            background_tasks.add_task(
                audit_settlement_background,
                data.group_id,
                data.from_user_id,
                data.to_user_id,
                data.tx_hash,
                data.amount,
                recipient_address,
                settlement_id,
                optimistic_splits
            )
            
            print(f"settlement insert result: {insert_result.data}")
        except Exception as e:
            print(f"settlement insert FAILED: {e}")

        log_activity(
            data.from_user_id,
            data.group_id,
            "payment_settled",
            f"Settled ADA {round(data.amount, 6)} — pending verification (tx: {data.tx_hash[:12]}...)"
        )

    return {"message": "Splits settled, auditing in background.", "settled": settled_count}


@router.get("/summary")
def get_user_summary(user_id: str):
    # get groups user belongs to
    member_result = (
        supabase.table("group_members")
        .select("group_id")
        .eq("user_id", user_id)
        .execute()
    )
    group_ids = [m["group_id"] for m in member_result.data]

    if not group_ids:
        return {"you_are_owed": 0, "you_owe": 0}

    # get all expenses in those groups
    expenses_result = (
        supabase.table("expenses")
        .select("*, expense_splits(user_id, amount_owed, is_settled)")
        .in_("group_id", group_ids)
        .execute()
    )

    # net balance per person: positive = they owe you, negative = you owe them
    balance_per_person: dict[str, float] = {}

    for expense in expenses_result.data:
        for split in expense.get("expense_splits", []):
            if split["is_settled"]:
                continue
            if expense["paid_by"] == user_id and split["user_id"] != user_id:
                # you paid, they owe you
                other = split["user_id"]
                balance_per_person[other] = balance_per_person.get(other, 0) + split["amount_owed"]
            elif split["user_id"] == user_id and expense["paid_by"] != user_id:
                # they paid, you owe them
                other = expense["paid_by"]
                balance_per_person[other] = balance_per_person.get(other, 0) - split["amount_owed"]

    # sum up netted balances
    total_owed_to_you = sum(v for v in balance_per_person.values() if v > 0)
    total_you_owe = sum(abs(v) for v in balance_per_person.values() if v < 0)

    return {
        "you_are_owed": round(total_owed_to_you, 6),
        "you_owe": round(total_you_owe, 6),
    }
