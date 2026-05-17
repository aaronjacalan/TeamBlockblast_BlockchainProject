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