import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase
from typing import Optional

router = APIRouter()


class NonceRequest(BaseModel):
    stake_address: str


class VerifyRequest(BaseModel):
    stake_address: str
    signed_message: str
    payment_address: Optional[str] = None


class UpdateProfile(BaseModel):
    user_id: str
    email: str
    display_name: Optional[str] = ""


@router.post("/auth/nonce")
def request_nonce(data: NonceRequest):
    stake_address = data.stake_address.strip()

    if not stake_address:
        raise HTTPException(status_code=400, detail="Stake address is required")

    nonce = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    existing = supabase.table("users") \
        .select("id") \
        .eq("stake_address", stake_address) \
        .maybe_single() \
        .execute()

    # CREATE USER if missing
    if existing is None:
        supabase.table("users").insert({
            "stake_address": stake_address,
            "auth_nonce": nonce,
            "nonce_expires_at": expires_at.isoformat()
        }).execute()
    else:
        supabase.table("users").update({
            "auth_nonce": nonce,
            "nonce_expires_at": expires_at.isoformat()
        }).eq("stake_address", stake_address).execute()

    return {"nonce": nonce}


@router.post("/auth/verify")
def verify_signature(data: VerifyRequest):
    stake_address = data.stake_address.strip()

    result = supabase.table("users") \
        .select("id, stake_address, auth_nonce, nonce_expires_at, display_name, email, payment_address") \
        .eq("stake_address", stake_address) \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = result.data[0]
    print("VERIFY USER:", user)
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.get("auth_nonce") or not user.get("nonce_expires_at"):
        raise HTTPException(status_code=400, detail="No active nonce, request one first")

    expires_at = datetime.fromisoformat(user["nonce_expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Nonce expired, request a new one")

    update_fields = {
        "auth_nonce": None,
        "nonce_expires_at": None,
    }
    payment_address = (data.payment_address or "").strip()
    if payment_address:
        update_fields["payment_address"] = payment_address

    updated = supabase.table("users").update(update_fields) \
        .eq("stake_address", stake_address) \
        .execute()

    refreshed = updated.data[0] if updated.data else user

    return {
        "user": {
            "id": refreshed["id"],
            "stake_address": refreshed.get("stake_address", user["stake_address"]),
            "payment_address": refreshed.get("payment_address"),
            "display_name": refreshed.get("display_name", ""),
            "email": refreshed.get("email", ""),
        },
        "message": "Welcome back!",
    }
    

@router.put("/profile")
def update_profile(data: UpdateProfile):
    if not data.email.strip():
        raise HTTPException(status_code=400, detail="Email is required")

    result = supabase.table("users").update({
        "email": data.email.strip(),
        "display_name": data.display_name.strip() if data.display_name else "",
    }).eq("id", data.user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]


@router.get("/profile")
def get_profile(user_id: str):
    result = supabase.table("users").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data

@router.get("/profile/by-email")
def get_profile_by_email(email: str):
    result = supabase.table("users").select("id, display_name, email").eq("email", email.strip()).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]