from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase

router = APIRouter()

class LoginRequest(BaseModel):
    wallet_address: str

@router.post("/login")
def login(data: LoginRequest):
    wallet = data.wallet_address.strip()

    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet address is required")

    # check if user already exists
    result = supabase.table("users").select("*").eq("wallet_address", wallet).execute()

    if result.data:
        # user exists, just return them
        return {"user": result.data[0], "message": "Welcome back!"}
    else:
        # first time login, create them
        new_user = supabase.table("users").insert({"wallet_address": wallet}).execute()
        return {"user": new_user.data[0], "message": "Account created!"}