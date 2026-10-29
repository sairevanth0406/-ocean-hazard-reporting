import os
import shutil
from pathlib import Path
import boto3
from fastapi import UploadFile, HTTPException
from app.core.config import settings
import uuid

class AwaitableStr(str):
    """A string that can be used either synchronously or with 'await'."""
    def __await__(self):
        async def _resolve():
            return str(self)
        return _resolve().__await__()

class S3Service:
    def __init__(self):
        """
        Initializes the Boto3 S3 client using credentials from settings if provided.
        """
        try:
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY and settings.AWS_S3_BUCKET_NAME:
                client_kwargs = {
                    "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
                    "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
                    "region_name": settings.AWS_S3_REGION or "us-east-1"
                }
                if settings.AWS_SESSION_TOKEN:
                    client_kwargs["aws_session_token"] = settings.AWS_SESSION_TOKEN

                self.s3_client = boto3.client("s3", **client_kwargs)
                self.bucket_name = settings.AWS_S3_BUCKET_NAME
            else:
                self.s3_client = None
                self.bucket_name = None
        except Exception as e:
            print(f"Error initializing S3 client: {e}")
            self.s3_client = None
            self.bucket_name = None

    def upload_file(self, file, media_type: str = "media", report_id = None) -> AwaitableStr:
        """
        Uploads a file to the configured S3 bucket, or falls back to local uploads directory
        if S3 is not configured.
        """
        try:
            is_upload_file = isinstance(file, UploadFile)
            original_filename = file.filename if is_upload_file else Path(str(file)).name
            file_extension = original_filename.split('.')[-1] if '.' in original_filename else "bin"

            unique_id = report_id or uuid.uuid4()
            unique_filename = f"{unique_id}-{uuid.uuid4()}.{file_extension}"

            if self.s3_client and self.bucket_name:
                s3_key = f"{media_type}s/{unique_filename}"
                content_type = file.content_type if is_upload_file else "application/octet-stream"

                extra_args = {'ContentType': content_type}
                try:
                    if is_upload_file:
                        file.file.seek(0)
                        self.s3_client.upload_fileobj(
                            file.file,
                            self.bucket_name,
                            s3_key,
                            ExtraArgs=extra_args
                        )
                    else:
                        self.s3_client.upload_file(
                            str(file),
                            self.bucket_name,
                            s3_key,
                            ExtraArgs=extra_args
                        )
                except Exception as upload_err:
                    print(f"S3 upload error: {upload_err}")
                    raise

                file_url = f"https://{self.bucket_name}.s3.{settings.AWS_S3_REGION}.amazonaws.com/{s3_key}"
                print(f"Successfully uploaded {original_filename} to S3: {file_url}")
                return AwaitableStr(file_url)
            else:
                dest_dir = Path("uploads") / "media"
                dest_dir.mkdir(parents=True, exist_ok=True)
                dest_path = dest_dir / unique_filename

                if is_upload_file:
                    file.file.seek(0)
                    with open(dest_path, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)
                else:
                    shutil.copyfile(str(file), str(dest_path))

                backend_url = (settings.BACKEND_URL or "http://localhost:8000").rstrip("/")
                file_url = f"{backend_url}/uploads/media/{unique_filename}"
                print(f"Saved media locally (S3 not configured): {file_url}")
                return AwaitableStr(file_url)

        except Exception as e:
            print(f"Error uploading file: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

s3_service = S3Service()
