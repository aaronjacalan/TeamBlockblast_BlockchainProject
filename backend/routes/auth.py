import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase

router = APIRouter()


class NonceRequest(BaseModel):
    stake_address: str


class VerifyRequest(BaseModel):
    stake_address: str
    signed_message: str


@router.post("/auth/nonce")
def request_nonce(data: NonceRequest):
    stake_address = data.stake_address.strip()

    if not stake_address:
        raise HTTPException(status_code=400, detail="Stake address is required")

    nonce = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    user_res = supabase.table("users") \
        .select("id") \
        .eq("stake_address", stake_address) \
        .maybe_single() \
        .execute()

    if user_res is None:
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
        .select("id, stake_address, auth_nonce, nonce_expires_at") \
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

    supabase.table("users").update({
        "auth_nonce": None,
        "nonce_expires_at": None
    }).eq("stake_address", stake_address).execute()

    return {
    "user": {
        "id": user["id"],
        "stake_address": user["stake_address"]
    },
    "message": "Welcome back!"
}