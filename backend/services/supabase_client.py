import os
from supabase import create_client, Client

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


def update_analysis_status(analysis_id: str, status: str) -> None:
    get_supabase().table("analyses").update({"status": status}).eq("id", analysis_id).execute()


def save_analysis_results(analysis_id: str, results: dict) -> None:
    get_supabase().table("analysis_results").insert({
        "analysis_id": analysis_id,
        **results,
    }).execute()


def download_csv(csv_url: str) -> bytes:
    """Download CSV from Supabase Storage given full public URL."""
    # URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    parts = csv_url.split("/storage/v1/object/public/")
    bucket_and_path = parts[1]
    bucket, *path_parts = bucket_and_path.split("/")
    path = "/".join(path_parts)
    response = get_supabase().storage.from_(bucket).download(path)
    return response
