from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter()


@router.get("/")
def get_notifications(user_id: str):
    result = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.put("/{notification_id}/read")
def mark_as_read(notification_id: str):
    result = supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()
    return result.data


@router.put("/read-all")
def mark_all_read(user_id: str):
    supabase.table("notifications").update({"is_read": True}).eq("user_id", user_id).execute()
    return {"message": "All marked as read"}


@router.delete("/{notification_id}")
def delete_notification(notification_id: str):
    supabase.table("notifications").delete().eq("id", notification_id).execute()
    return {"message": "Deleted"}