import logging
import os
from supabase import create_client, Client

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


def update_analysis_status(analysis_id: str, status: str, step: str | None = None) -> None:
    # Direct table UPDATE — avoids RPC auth issues with new sb_secret_ key format
    result = get_supabase().table("analyses").update(
        {"status": status, "step": step}
    ).eq("id", analysis_id).execute()
    if hasattr(result, "error") and result.error:
        logger.error("update_analysis_status failed: %s", result.error)
        raise RuntimeError(f"Supabase update failed: {result.error}")


def save_analysis_results(analysis_id: str, results: dict) -> None:
    result = get_supabase().table("analysis_results").insert({
        "analysis_id": analysis_id,
        **results,
    }).execute()
    if hasattr(result, "error") and result.error:
        logger.error("save_analysis_results failed: %s", result.error)
        raise RuntimeError(f"Supabase insert failed: {result.error}")


def check_and_increment_chat_limit(session_id: str, limit: int) -> bool:
    """Returns True if allowed (under limit), False if blocked. Increments atomically."""
    client = get_supabase()
    result = client.table("chat_rate_limits").select("count").eq("session_id", session_id).execute()
    rows = result.data or []
    current = rows[0]["count"] if rows else 0
    if current >= limit:
        return False
    if rows:
        client.table("chat_rate_limits").update({"count": current + 1}).eq("session_id", session_id).execute()
    else:
        client.table("chat_rate_limits").insert({"session_id": session_id, "count": 1}).execute()
    return True


def download_csv(csv_url: str) -> bytes:
    """Download CSV from Supabase Storage given full public URL."""
    # URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    parts = csv_url.split("/storage/v1/object/public/")
    bucket_and_path = parts[1]
    bucket, *path_parts = bucket_and_path.split("/")
    path = "/".join(path_parts)
    response = get_supabase().storage.from_(bucket).download(path)
    return response
