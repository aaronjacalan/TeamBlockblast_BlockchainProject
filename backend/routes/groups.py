from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase
import secrets
from datetime import datetime, timedelta, timezone

router = APIRouter()


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    created_by: str  # user uuid


class GroupInviteCreate(BaseModel):
    group_id: str
    created_by: str  # user uuid


@router.get("/")
def get_all_groups():
    result = (
        supabase.table("groups")
        .select("*, group_members(user_id)")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/{group_id}")
def get_group(group_id: str):
    result = (
        supabase.table("groups")
        .select("*, group_members(user_id, joined_at, users(id, stake_address))")
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

    # verify user exists
    user_result = supabase.table("users").select("id").eq("id", data.created_by).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    # create the group
    group_result = supabase.table("groups").insert({
        "name": data.name.strip(),
        "description": data.description,
        "image_url": data.image_url,
        "created_by": data.created_by,
    }).execute()

    group = group_result.data[0]
    group_id = group["id"]

    # add creator to group_members
    supabase.table("group_members").insert({
        "group_id": group_id,
        "user_id": data.created_by,
    }).execute()

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

    # check if user is already a member
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

    return {"message": "Joined group successfully"}


@router.post("/invites")
def create_invite(data: GroupInviteCreate):
    # verify group exists
    group_result = supabase.table("groups").select("id").eq("id", data.group_id).execute()
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
    # verify requester is the group creator
    group_result = supabase.table("groups").select("created_by").eq("id", group_id).execute()
    if not group_result.data:
        raise HTTPException(status_code=404, detail="Group not found")

    if group_result.data[0]["created_by"] != requester_id and requester_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this member")

    supabase.table("group_members").delete().eq("group_id", group_id).eq("user_id", user_id).execute()

    return {"message": "Member removed successfully"}