from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from database import supabase
import secrets
from datetime import datetime, timedelta, timezone
from routes.utils import recalculate_splits_for_group, verify_transaction_payment
import requests
import os
import time

router = APIRouter()


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    created_by: str  # user uuid
    tx_hash: str     # transaction hash of the 1.0 ADA creation fee
    status: Optional[str] = "inactive"
    initial_members: Optional[List[str]] = []



class GroupInviteCreate(BaseModel):
    group_id: str
    created_by: str  # user uuid

class InviteByEmail(BaseModel):
    email: str
    invited_by: str  # user_id of who is inviting

# ── Helpers ───────────────────────────────────────────────────────────────────

def verify_cardano_tx(tx_hash: str) -> bool:
    return verify_transaction_payment(tx_hash, os.getenv("FAIRSHARE_ADDRESS"), 1.0)



def log_activity(user_id: str, group_id: str, type: str, description: str):
    try:
        supabase.table("activities").insert({
            "user_id": user_id,
            "group_id": group_id,
            "type": type,
            "description": description,
        }).execute()
    except:
        pass  # don't crash the main request if logging fails


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/activities")
def get_activities(user_id: str):
    result = (
        supabase.table("activities")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    return result.data


@router.get("/")
def get_all_groups(user_id: str):
    # first get group ids where user is a member
    member_result = (
        supabase.table("group_members")
        .select("group_id")
        .eq("user_id", user_id)
        .execute()
    )
    
    group_ids = [m["group_id"] for m in member_result.data]
    
    if not group_ids:
        return []

    # then get those groups with ALL their members
    result = (
        supabase.table("groups")
        .select("*, group_members(user_id)")
        .in_("id", group_ids)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/{group_id}")
def get_group(group_id: str):
    result = (
        supabase.table("groups")
        .select("*, group_members(user_id, joined_at, users(id, stake_address, payment_address, display_name, email))")
        .eq("id", group_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Group not found")
    return result.data


class GroupUpdate(BaseModel):
    name: str
    description: Optional[str] = ""
    requester_id: str


@router.put("/{group_id}")
def update_group(group_id: str, data: GroupUpdate):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Group name is required")
        
    # Check if group exists
    group_res = supabase.table("groups").select("*").eq("id", group_id).execute()
    if not group_res.data:
        raise HTTPException(status_code=404, detail="Group not found")
        
    group = group_res.data[0]
    
    # Check authorization: requester must be a member
    member_res = supabase.table("group_members").select("id").eq("group_id", group_id).eq("user_id", data.requester_id).execute()
    if not member_res.data and group.get("created_by") != data.requester_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this group")
        
    # Perform update in database
    supabase.table("groups").update({
        "name": data.name.strip(),
        "description": data.description.strip(),
    }).eq("id", group_id).execute()
    
    return get_group(group_id)


def send_group_invite_by_email(group_id: str, email: str, invited_by: str, group_name: str):
    try:
        # find user by email
        user_result = supabase.table("users").select("id").eq("email", email.strip()).execute()
        if not user_result.data:
            print(f"[INVITE WARNING] User with email {email} not found. Invite skipped.")
            return

        invited_user_id = user_result.data[0]["id"]

        # check if already a member
        existing = (
            supabase.table("group_members")
            .select("id")
            .eq("group_id", group_id)
            .eq("user_id", invited_user_id)
            .execute()
        )
        if existing.data:
            return

        # check if already invited
        existing_notif = (
            supabase.table("notifications")
            .select("id")
            .eq("user_id", invited_user_id)
            .eq("type", "group_invite")
            .eq("metadata->>group_id", group_id)
            .execute()
        )
        if existing_notif.data:
            return

        # create notification for the invited user
        supabase.table("notifications").insert({
            "user_id": invited_user_id,
            "type": "group_invite",
            "title": "Group Invite",
            "message": f"You've been invited to join \"{group_name}\"",
            "metadata": {
                "group_id": group_id,
                "invited_by": invited_by,
            }
        }).execute()
        print(f"[INVITE SUCCESS] Sent group invite to {email}")
    except Exception as err:
        print(f"[INVITE ERROR] Failed to invite {email}: {err}")


def background_verify_group_payment(group_id: str, tx_hash: str, created_by: str, name: str, initial_members: list = None):
    print(f"\n=== BACKGROUND GROUP VERIFICATION START: group={group_id}, tx={tx_hash} ===")
    verified = False
    for attempt in range(1, 6):
        print(f"  [Attempt {attempt}/5] Verifying transaction on Cardano blockchain...")
        try:
            if verify_cardano_tx(tx_hash):
                verified = True
                break
        except Exception as e:
            print(f"  [Attempt {attempt}/5] Verification pending/failed: {str(e)}")
        
        if attempt < 5:
            time.sleep(10)
            
    if verified:
        print(f"  [BACKGROUND GROUP VERIFICATION SUCCESS] Group {group_id} payment verified!")
        try:
            # 1. Update status to active in database
            supabase.table("groups").update({"status": "active"}).eq("id", group_id).execute()
            
            # 2. Record creation fee expense/splits
            existing_expense = supabase.table("expenses").select("id").eq("tx_hash", tx_hash).execute()
            if not existing_expense.data:
                expense_result = supabase.table("expenses").insert({
                    "group_id": group_id,
                    "paid_by": created_by,
                    "name": "Group Creation Fee",
                    "amount": 1.0,
                    "currency": "ADA",
                    "split_type": "equal",
                    "tx_status": "settled",
                    "tx_hash": tx_hash,
                }).execute()
                
                if expense_result.data:
                    expense_id = expense_result.data[0]["id"]
                    supabase.table("expense_splits").insert({
                        "expense_id": expense_id,
                        "user_id": created_by,
                        "amount_owed": 1.0,
                        "is_settled": True,
                    }).execute()
                    
            # 3. Log activity
            log_activity(created_by, group_id, "group_created", f"Created group \"{name}\"")
            
            # 4. Notify creator
            supabase.table("notifications").insert({
                "user_id": created_by,
                "type": "group_activated",
                "title": "Group Active",
                "message": f"Success! Payment verified. Your group \"{name}\" is now active!",
                "metadata": {
                    "group_id": group_id,
                    "tx_hash": tx_hash,
                }
            }).execute()

            # 5. Send invites to initial members if any
            if initial_members:
                for email in initial_members:
                    send_group_invite_by_email(group_id, email, created_by, name)
        except Exception as err:
            print(f"  [BACKGROUND ERROR] Failed to complete activation database writes: {err}")
    else:
        print(f"  [BACKGROUND GROUP VERIFICATION FAILED] Group {group_id} verification failed after 5 attempts.")
        try:
            # Update status to payment_failed
            supabase.table("groups").update({"status": "payment_failed"}).eq("id", group_id).execute()
            
            # Notify creator of failure
            supabase.table("notifications").insert({
                "user_id": created_by,
                "type": "payment_failed",
                "title": "Group Payment Failed",
                "message": f"We could not verify the 1.0 ADA fee for group \"{name}\" on-chain. Marked as Payment Failed.",
                "metadata": {
                    "group_id": group_id,
                    "tx_hash": tx_hash,
                }
            }).execute()
        except Exception as err:
            print(f"  [BACKGROUND ERROR] Failed to record payment failure: {err}")


@router.post("/")
def create_group(data: GroupCreate, background_tasks: BackgroundTasks):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Group name is required")

    if not data.created_by.strip():
        raise HTTPException(status_code=400, detail="created_by is required")

    if not data.tx_hash.strip():
        raise HTTPException(status_code=400, detail="Transaction hash for the 1.0 ADA creation fee is required")

    # verify user exists
    user_result = supabase.table("users").select("id").eq("id", data.created_by).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    # --- REPLAY PROTECTION ---
    # Check if this transaction hash has already been used to create a group
    existing_group = supabase.table("groups").select("id").eq("image_url", data.tx_hash.strip()).execute()
    if existing_group.data:
        raise HTTPException(
            status_code=400,
            detail="Replay Protection: This transaction hash has already been used to create another group."
        )

    # Determine if we should verify synchronously or asynchronously
    req_status = data.status or "inactive"

    if req_status == "active":
        # Synchronous verification
        verify_transaction_payment(data.tx_hash.strip(), os.getenv("FAIRSHARE_ADDRESS"), 1.0)

        # --- WRITE TO DATABASE ---
        group_result = supabase.table("groups").insert({
            "name": data.name.strip(),
            "description": data.description,
            "image_url": data.tx_hash.strip(),
            "created_by": data.created_by,
            "status": "active"
        }).execute()

        group = group_result.data[0]
        group_id = group["id"]

        supabase.table("group_members").insert({
            "group_id": group_id,
            "user_id": data.created_by,
        }).execute()

        try:
            expense_result = supabase.table("expenses").insert({
                "group_id": group_id,
                "paid_by": data.created_by,
                "name": "Group Creation Fee",
                "amount": 1.0,
                "currency": "ADA",
                "split_type": "equal",
                "tx_status": "settled",
                "tx_hash": data.tx_hash.strip(),
            }).execute()
            
            if expense_result.data:
                expense_id = expense_result.data[0]["id"]
                
                # Create a fully settled split for the creator since they are the sole member
                supabase.table("expense_splits").insert({
                    "expense_id": expense_id,
                    "user_id": data.created_by,
                    "amount_owed": 1.0,
                    "is_settled": True,
                }).execute()
        except Exception as db_err:
            print(f"[DATABASE WARNING] Failed to record creation fee in expenses table: {str(db_err)}")

        # Log the activity
        log_activity(data.created_by, group_id, "group_created", f"Created group \"{data.name}\"")

        # Send invites to initial members if any
        if data.initial_members:
            for email in data.initial_members:
                send_group_invite_by_email(group_id, email, data.created_by, data.name.strip())

        return group
    else:
        # Asynchronous/Fast verification flow (status="inactive")
        group_result = supabase.table("groups").insert({
            "name": data.name.strip(),
            "description": data.description,
            "image_url": data.tx_hash.strip(),
            "created_by": data.created_by,
            "status": "inactive"
        }).execute()

        group = group_result.data[0]
        group_id = group["id"]

        supabase.table("group_members").insert({
            "group_id": group_id,
            "user_id": data.created_by,
        }).execute()

        # Trigger background task
        background_tasks.add_task(
            background_verify_group_payment,
            group_id,
            data.tx_hash.strip(),
            data.created_by,
            data.name.strip(),
            data.initial_members
        )

        return group


@router.post("/{group_id}/verify")
def verify_group_payment_manually(group_id: str):
    # Fetch group
    group_result = supabase.table("groups").select("*").eq("id", group_id).execute()
    if not group_result.data:
        raise HTTPException(status_code=404, detail="Group not found")
        
    group = group_result.data[0]
    tx_hash = group.get("image_url")  # Store hash in image_url column
    created_by = group.get("created_by")
    name = group.get("name")
    
    if group.get("status") == "active":
        return {"status": "active", "message": "Group is already active!"}
        
    if not tx_hash:
        raise HTTPException(status_code=400, detail="Transaction hash is missing for this group.")
        
    # Verify transaction on-chain
    is_verified = verify_cardano_tx(tx_hash)
    
    if is_verified:
        # Update status to active
        supabase.table("groups").update({"status": "active"}).eq("id", group_id).execute()
        
        # Create creation fee expense/splits
        try:
            existing_expense = supabase.table("expenses").select("id").eq("tx_hash", tx_hash).execute()
            if not existing_expense.data:
                expense_result = supabase.table("expenses").insert({
                    "group_id": group_id,
                    "paid_by": created_by,
                    "name": "Group Creation Fee",
                    "amount": 1.0,
                    "currency": "ADA",
                    "split_type": "equal",
                    "tx_status": "settled",
                    "tx_hash": tx_hash,
                }).execute()
                
                if expense_result.data:
                    expense_id = expense_result.data[0]["id"]
                    supabase.table("expense_splits").insert({
                        "expense_id": expense_id,
                        "user_id": created_by,
                        "amount_owed": 1.0,
                        "is_settled": True,
                    }).execute()
        except Exception as db_err:
            print(f"[DATABASE WARNING] Failed to record creation fee: {db_err}")
            
        log_activity(created_by, group_id, "group_created", f"Created group \"{name}\"")
        return {"status": "active", "message": "Group payment verified and activated successfully!"}
    else:
        raise HTTPException(
            status_code=400,
            detail="Transaction has not been confirmed on the Cardano blockchain yet. Please wait a few more seconds."
        )



@router.post("/{group_id}/join")
def join_group(group_id: str, invite_code: str, user_id: str):
    # verify invite code is valid
    invite_result = (
        supabase.table("group_invites")
        .select("*")
        .eq("group_id", group_id)
        .eq("invite_code", invite_code)
        .eq("status", "pending")
        .execute()
    )

    if not invite_result.data:
        raise HTTPException(status_code=404, detail="Invalid or expired invite code")

    invite = invite_result.data[0]

    # check expiry
    if invite.get("expires_at"):
        expires_at = datetime.fromisoformat(invite["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            supabase.table("group_invites").update({"status": "expired"}).eq("id", invite["id"]).execute()
            raise HTTPException(status_code=400, detail="Invite has expired")

    # check if already a member
    existing = (
        supabase.table("group_members")
        .select("id")
        .eq("group_id", group_id)
        .eq("user_id", user_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="User is already a member of this group")

    # add to group_members
    supabase.table("group_members").insert({
        "group_id": group_id,
        "user_id": user_id,
    }).execute()

    # log activity
    log_activity(user_id, group_id, "member_joined", f"Joined the group")

    return {"message": "Joined group successfully"}


@router.post("/invites")
def create_invite(data: GroupInviteCreate):
    # verify group exists
    group_result = supabase.table("groups").select("id, name").eq("id", data.group_id).execute()
    if not group_result.data:
        raise HTTPException(status_code=404, detail="Group not found")

    # verify creator is a member
    member_result = (
        supabase.table("group_members")
        .select("id")
        .eq("group_id", data.group_id)
        .eq("user_id", data.created_by)
        .execute()
    )
    if not member_result.data:
        raise HTTPException(status_code=403, detail="Only group members can create invites")

    invite_code = secrets.token_urlsafe(16)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invite_result = supabase.table("group_invites").insert({
        "group_id": data.group_id,
        "created_by": data.created_by,
        "invite_code": invite_code,
        "status": "pending",
        "expires_at": expires_at.isoformat(),
    }).execute()

    return invite_result.data[0]


@router.delete("/{group_id}/members/{user_id}")
def remove_member(group_id: str, user_id: str, requester_id: str):
    # verify group exists and get creator
    group_result = supabase.table("groups").select("created_by, name").eq("id", group_id).execute()
    if not group_result.data:
        raise HTTPException(status_code=404, detail="Group not found")

    if group_result.data[0]["created_by"] != requester_id and requester_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this member")

    supabase.table("group_members").delete().eq("group_id", group_id).eq("user_id", user_id).execute()
    recalculate_splits_for_group(group_id)  
    # log activity
    log_activity(requester_id, group_id, "member_removed", f"Removed a member from the group")

    return {"message": "Member removed successfully"}


@router.post("/{group_id}/invite")
def invite_by_email(group_id: str, data: InviteByEmail):
    # verify group exists
    group_result = supabase.table("groups").select("id, name").eq("id", group_id).execute()
    if not group_result.data:
        raise HTTPException(status_code=404, detail="Group not found")

    group = group_result.data[0]

    # find user by email
    user_result = supabase.table("users").select("id").eq("email", data.email.strip()).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found. They need to sign up first.")

    invited_user_id = user_result.data[0]["id"]

    # check if already a member
    existing = (
        supabase.table("group_members")
        .select("id")
        .eq("group_id", group_id)
        .eq("user_id", invited_user_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="User is already a member of this group")

    # check if already invited
    existing_notif = (
        supabase.table("notifications")
        .select("id")
        .eq("user_id", invited_user_id)
        .eq("type", "group_invite")
        .eq("metadata->>group_id", group_id)
        .execute()
    )
    if existing_notif.data:
        raise HTTPException(status_code=400, detail="User has already been invited")

    # create notification for the invited user
    supabase.table("notifications").insert({
        "user_id": invited_user_id,
        "type": "group_invite",
        "title": "Group Invite",
        "message": f"You've been invited to join \"{group['name']}\"",
        "metadata": {
            "group_id": group_id,
            "invited_by": data.invited_by,
        }
    }).execute()

    return {"message": "Invite sent successfully"}


class InviteResponse(BaseModel):
    user_id: str
    action: str  # "accept" or "reject"


@router.patch("/{group_id}/invite/respond")
def respond_to_invite(group_id: str, data: InviteResponse):
    if data.action not in ("accept", "reject"):
        raise HTTPException(status_code=400, detail="Invalid action")

    # find the pending invite notification
    notif_result = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", data.user_id)
        .eq("type", "group_invite")
        .eq("metadata->>group_id", group_id)
        .single()
        .execute()
    )
    if not notif_result.data:
        raise HTTPException(status_code=404, detail="Invite not found")

    notif = notif_result.data
    invited_by = notif["metadata"]["invited_by"]

    if data.action == "accept":
        # check not already a member
        existing = (
            supabase.table("group_members")
            .select("id")
            .eq("group_id", group_id)
            .eq("user_id", data.user_id)
            .execute()
        )
        if not existing.data:
            supabase.table("group_members").insert({
                "group_id": group_id,
                "user_id": data.user_id,
            }).execute()
            log_activity(data.user_id, group_id, "member_joined", "Joined the group via invite")
            recalculate_splits_for_group(group_id)  

    # delete the invite notification from invitee's feed
    supabase.table("notifications").delete().eq("id", notif["id"]).execute()

    # notify the inviter of the response
    group_result = supabase.table("groups").select("name").eq("id", group_id).single().execute()
    invitee_result = supabase.table("users").select("display_name, email").eq("id", data.user_id).single().execute()

    group_name = group_result.data.get("name", "the group")
    invitee_label = invitee_result.data.get("display_name") or invitee_result.data.get("email") or "Someone"
    verb = "accepted" if data.action == "accept" else "declined"

    supabase.table("notifications").insert({
        "user_id": invited_by,
        "type": "invite_response",
        "title": f"Invite {verb}",
        "message": f"{invitee_label} {verb} your invite to \"{group_name}\".",
        "metadata": {
            "group_id": group_id,
            "action": data.action,
        },
    }).execute()

    return {"message": f"Invite {verb}"}

@router.post("/{group_id}/settle-agreement")
def toggle_settle_agreement(group_id: str, user_id: str):
    # check if user already agreed
    existing = (
        supabase.table("group_settlements")
        .select("id")
        .eq("group_id", group_id)
        .eq("user_id", user_id)
        .execute()
    )

    if existing.data:
        # uncheck — remove agreement
        supabase.table("group_settlements").delete().eq("group_id", group_id).eq("user_id", user_id).execute()
        agreed = False
    else:
        # check — add agreement
        supabase.table("group_settlements").insert({
            "group_id": group_id,
            "user_id": user_id,
        }).execute()
        agreed = True

    # check if ALL members have agreed
    members = supabase.table("group_members").select("user_id").eq("group_id", group_id).execute()
    agreements = supabase.table("group_settlements").select("user_id").eq("group_id", group_id).execute()

    member_ids = set(m["user_id"] for m in members.data)
    agreed_ids = set(a["user_id"] for a in agreements.data)

    if member_ids == agreed_ids and len(member_ids) > 0:
        # everyone agreed — mark group as settled
        supabase.table("groups").update({"status": "settled"}).eq("id", group_id).execute()
        log_activity(user_id, group_id, "group_settled", "All members agreed to settle the group")
        return {"agreed": agreed, "group_status": "settled"}
    else:
        # revert to active if someone unchecked
        supabase.table("groups").update({"status": "active"}).eq("id", group_id).execute()
        return {"agreed": agreed, "group_status": "active", "waiting_for": len(member_ids - agreed_ids)}


@router.get("/{group_id}/settle-agreement")
def get_settle_agreements(group_id: str):
    result = supabase.table("group_settlements").select("user_id, agreed_at").eq("group_id", group_id).execute()
    return result.data