from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase
import secrets
from datetime import datetime, timedelta, timezone
from routes.utils import recalculate_splits_for_group
import requests
import os

router = APIRouter()


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    created_by: str  # user uuid
    tx_hash: str     # transaction hash of the 1.0 ADA creation fee
    blockfrost_api_key: str  # Blockfrost key passed from the frontend


class GroupInviteCreate(BaseModel):
    group_id: str
    created_by: str  # user uuid

class InviteByEmail(BaseModel):
    email: str
    invited_by: str  # user_id of who is inviting

# ── Helpers ───────────────────────────────────────────────────────────────────

def verify_cardano_tx(tx_hash: str, blockfrost_api_key: str) -> bool:
    """
    Verifies that a Cardano transaction exists in the blockchain (either 
    already minted in a block, or currently pending in the mempool).
    This ensures instant validation without making the user wait for on-chain block minting.
    """
    raw_address = os.getenv("FAIRSHARE_ADDRESS")
    if not blockfrost_api_key or not raw_address:
        raise HTTPException(
            status_code=500,
            detail="Backend configuration error: BLOCKFROST_API_KEY (from frontend) or FAIRSHARE_ADDRESS is missing."
        )

    # Clean all whitespaces from target address and key
    fairshare_address = "".join(raw_address.split())

    # Clean all whitespaces from the API key (including spaces in the middle)
    api_key = "".join(blockfrost_api_key.split())
    network = "preview" if api_key.startswith("preview") else "mainnet"
    base_url = f"https://cardano-{network}.blockfrost.io/api/v0"

    headers = {"project_id": api_key}

    # 1. First, check if the transaction is already minted in a block
    tx_url = f"{base_url}/txs/{tx_hash}"
    try:
        response = requests.get(tx_url, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"\n[BLOCKFROST] Transaction {tx_hash} verified: Already minted in a block.")
            return True
    except requests.RequestException:
        pass  # Fallback to mempool check if the network call itself fails or times out

    # 2. If not minted yet, check if it is pending in the mempool
    mempool_url = f"{base_url}/mempool/{tx_hash}"
    try:
        response = requests.get(mempool_url, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"\n[BLOCKFROST] Transaction {tx_hash} verified: Pending in the mempool.")
            return True
        elif response.status_code == 404:
            raise HTTPException(
                status_code=400,
                detail="Payment verification failed: Transaction hash not found in blocks or mempool. Please wait a few seconds and try again."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Cardano blockchain lookup failed via Blockfrost (Status code: {response.status_code})."
            )
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to check blockchain status due to a connection issue with Blockfrost: {str(e)}"
        )



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


@router.post("/")
def create_group(data: GroupCreate):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Group name is required")

    if not data.created_by.strip():
        raise HTTPException(status_code=400, detail="created_by is required")

    if not data.tx_hash.strip():
        raise HTTPException(status_code=400, detail="Transaction hash for the 1.0 ADA creation fee is required")

    if not data.blockfrost_api_key.strip():
        raise HTTPException(status_code=400, detail="Blockfrost API key is required from client for validation")

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

    # --- CARDANO ON-CHAIN VERIFICATION ---
    # Verify that the 1.0 ADA transaction went through on-chain using the Blockfrost API passed from frontend
    verify_cardano_tx(data.tx_hash.strip(), data.blockfrost_api_key.strip())

    # --- PRINT CONFIRMATION TO TERMINAL ---
    print("\n" + "="*80)
    print(" [CARDANO FEE VERIFICATION CONFIRMED]")
    print(f" Transaction Hash: {data.tx_hash.strip()}")
    print(" Status: SUCCESS (1.0 ADA Verified On-Chain)")
    print(f" Group Name: {data.name.strip()}")
    print(f" Creator UUID: {data.created_by}")
    print(" Action: Storing group in Supabase database...")
    print("="*80 + "\n")

    # --- WRITE TO DATABASE ---
    # 1. Create the group record in Supabase
    group_result = supabase.table("groups").insert({
        "name": data.name.strip(),
        "description": data.description,
        "image_url": data.tx_hash.strip(),  # Store the verified hash in image_url column
        "created_by": data.created_by,
    }).execute()

    group = group_result.data[0]
    group_id = group["id"]

    # 2. Add the creator as the first group member
    supabase.table("group_members").insert({
        "group_id": group_id,
        "user_id": data.created_by,
    }).execute()

    # 3. Add the Group Creation Fee of 1.0 ADA directly into the `expenses` and `expense_splits` tables.
    # This logs the transaction payment in the expenses system.
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

    # 4. Log the activity
    log_activity(data.created_by, group_id, "group_created", f"Created group \"{data.name}\"")

    return group



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