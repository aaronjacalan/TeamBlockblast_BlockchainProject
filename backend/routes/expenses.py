from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase
from routes.groups import log_activity

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


@router.patch("/settle")
def settle_splits(data: SettleRequest):
    print("=== SETTLE REQUEST ===")
    print(f"group_id: {data.group_id}")
    print(f"from_user_id: {data.from_user_id}")
    print(f"to_user_id: {data.to_user_id}")
    print(f"tx_hash: {data.tx_hash}")

    expenses_result = (
        supabase.table("expenses")
        .select("id, amount")
        .eq("group_id", data.group_id)
        .eq("paid_by", data.to_user_id)
        .execute()
    )
    print(f"expenses found: {expenses_result.data}")

    if not expenses_result.data:
        print("NO EXPENSES FOUND - returning early")
        return {"message": "No expenses to settle", "settled": 0}

    expense_ids = [e["id"] for e in expenses_result.data]
    settled_count = 0
    total_amount = 0.0

    for expense_id in expense_ids:
        print(f"--- processing expense_id: {expense_id}")

        split_check = (
            supabase.table("expense_splits")
            .select("amount_owed")
            .eq("expense_id", expense_id)
            .eq("user_id", data.from_user_id)
            .eq("is_settled", False)
            .execute()
        )
        print(f"split_check result: {split_check.data}")

        if split_check.data:
            total_amount += split_check.data[0]["amount_owed"]
            settled_count += 1
            update_result = supabase.table("expense_splits").update({"is_settled": True}).eq("expense_id", expense_id).eq("user_id", data.from_user_id).execute()
            print(f"split update result: {update_result.data}")
        else:
            print(f"no unsettled split found for expense {expense_id}")

        splits = (
            supabase.table("expense_splits")
            .select("is_settled")
            .eq("expense_id", expense_id)
            .execute()
        )
        print(f"all splits for expense: {splits.data}")
        all_settled = all(s["is_settled"] for s in splits.data) if splits.data else False
        print(f"all_settled: {all_settled}")

        if all_settled:
            supabase.table("expenses").update({
                "tx_status": "settled",
                "tx_hash": data.tx_hash,
            }).eq("id", expense_id).execute()
            print(f"expense {expense_id} marked as settled")

    print(f"total_amount: {total_amount}")
    print(f"settled_count: {settled_count}")

    try:
        insert_result = supabase.table("settlements").insert({
            "group_id": data.group_id,
            "from_user": data.from_user_id,
            "to_user": data.to_user_id,
            "amount": round(total_amount, 6),
            "tx_hash": data.tx_hash,
            "tx_status": "confirmed",
        }).execute()
        print(f"settlement insert result: {insert_result.data}")
    except Exception as e:
        print(f"settlement insert FAILED: {e}")

    log_activity(
        data.from_user_id,
        data.group_id,
        "payment_settled",
        f"Settled ADA {round(total_amount, 6)} — tx {data.tx_hash[:12]}..."
    )

    return {"message": "Splits settled", "settled": settled_count}


@router.delete("/{expense_id}")
def delete_expense(expense_id: str):
    # delete splits first
    supabase.table("expense_splits").delete().eq("expense_id", expense_id).execute()
    # delete expense
    supabase.table("expenses").delete().eq("id", expense_id).execute()
    return {"message": "Expense deleted"}


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
