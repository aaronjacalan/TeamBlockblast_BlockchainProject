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


@router.delete("/{expense_id}")
def delete_expense(expense_id: str):
    # delete splits first
    supabase.table("expense_splits").delete().eq("expense_id", expense_id).execute()
    # delete expense
    supabase.table("expenses").delete().eq("id", expense_id).execute()
    return {"message": "Expense deleted"}