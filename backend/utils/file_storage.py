"""File storage utility — local filesystem with S3 extension point."""
import os
import uuid
import aiofiles
from fastapi import UploadFile
from config import settings


async def save_upload_file(file: UploadFile, subfolder: str = "resumes") -> tuple[str, int]:
    """
    Save an uploaded file to local storage.
    Returns (file_path, file_size).
    """
    upload_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename to prevent collisions
    ext = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, unique_name)

    # Stream file to disk
    file_size = 0
    async with aiofiles.open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 64):  # 64KB chunks
            await f.write(chunk)
            file_size += len(chunk)

    return file_path, file_size


async def delete_file(file_path: str) -> bool:
    """Delete a file from storage."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except OSError:
        pass
    return False


def get_file_path(file_path: str) -> str | None:
    """Verify file exists and return its absolute path."""
    if os.path.exists(file_path):
        return os.path.abspath(file_path)
    return None
