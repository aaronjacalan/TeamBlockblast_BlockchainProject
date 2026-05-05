from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase

router = APIRouter()

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    image_url: Optional[str] = "group"
    members: list[str] = []  # list of wallet addresses
    created_by: str           # wallet address of the creator

@router.get("/")
def get_all_groups():
    # get all groups from supabase, ordered by newest first
    result = supabase.table("groups").select("*").order("created_at", desc=True).execute()
    return result.data

@router.post("/")
def create_group(data: GroupCreate):
    # 1. basic validation
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Group name is required")

    if not data.created_by.strip():
        raise HTTPException(status_code=400, detail="created_by (wallet address) is required")

    # 2. make sure creator is always in the members list
    members = data.members
    if data.created_by not in members:
        members = [data.created_by] + members

    # 3. save to supabase
    result = supabase.table("groups").insert({
        "name": data.name.strip(),
        "description": data.description,
        "image_url": data.image_url,
        "members": members,
        "created_by": data.created_by,
    }).execute()

    # 4. return the created group
    return result.data[0]