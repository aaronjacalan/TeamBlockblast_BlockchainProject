import os
import requests
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/protocol-parameters")
def get_protocol_parameters():
    api_key = os.getenv("BLOCKFROST_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Backend configuration error: BLOCKFROST_API_KEY is not defined in the backend environment."
        )

    # Clean all whitespaces
    api_key = "".join(api_key.split())
    network = "preview" if api_key.startswith("preview") else "mainnet"
    url = f"https://cardano-{network}.blockfrost.io/api/v0/epochs/latest/parameters"

    headers = {"project_id": api_key}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            return res.json()
        else:
            raise HTTPException(
                status_code=res.status_code,
                detail=f"Blockfrost returned error: {res.text}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch protocol parameters: {str(e)}"
        )
