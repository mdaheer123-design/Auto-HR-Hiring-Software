"""
Retention service — Background tasks for data cleanup and retention policies.

Every 1 hour this service:
  1. Deletes all Application records whose applied_at >= 7 days ago.
  2. Deletes all Job postings whose created_at >= 7 days ago
     (cascade deletes their remaining applications automatically).
  3. Cleans up orphaned Resume records, physical files, and ES documents.
"""
import os
import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from database import async_session
from models.application import Application
from models.job import Job
from models.resume import Resume
from services.search_service import delete_resume_from_index


async def cleanup_old_applications():
    """
    Full weekly retention cleanup:
      - Delete applications older than 7 days (per-application, independent).
      - Delete job postings older than 7 days (cascades their applications).
      - Clean up orphaned resumes (DB + file + Elasticsearch).
    """
    print("[INFO] Running 7-day retention cleanup...")

    async with async_session() as session:
        cutoff_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
        resume_ids_to_check = set()

        # ── Phase 1: Delete old applications (independent of jobs) ──
        app_result = await session.execute(
            select(Application).where(Application.applied_at <= cutoff_date)
        )
        old_apps = app_result.scalars().all()

        deleted_app_count = 0
        for app in old_apps:
            if app.resume_id:
                resume_ids_to_check.add(app.resume_id)
            await session.delete(app)
            deleted_app_count += 1

        if deleted_app_count:
            await session.commit()
            print(f"[INFO] Deleted {deleted_app_count} applications older than 7 days.")
        else:
            print("[INFO] No applications older than 7 days found.")

        # ── Phase 2: Delete old job postings ──
        # Collect resume IDs from applications still attached to old jobs
        # (these may not have been caught in Phase 1 if applied_at < 7 days
        #  but the job itself is > 7 days old).
        job_result = await session.execute(
            select(Job).where(Job.created_at <= cutoff_date)
        )
        old_jobs = job_result.scalars().all()

        deleted_job_count = 0
        for job in old_jobs:
            # Gather resume IDs from any remaining applications on this job
            remaining_apps_result = await session.execute(
                select(Application.resume_id).where(Application.job_id == job.id)
            )
            for row in remaining_apps_result.all():
                if row[0]:
                    resume_ids_to_check.add(row[0])

            # Delete job (cascade deletes its applications)
            await session.delete(job)
            deleted_job_count += 1

        if deleted_job_count:
            await session.commit()
            print(f"[INFO] Deleted {deleted_job_count} job postings older than 7 days.")
        else:
            print("[INFO] No job postings older than 7 days found.")

        # ── Phase 3: Orphaned resume cleanup ──
        orphaned_resumes_count = 0
        for r_id in resume_ids_to_check:
            count_res = await session.execute(
                select(func.count()).select_from(Application).where(Application.resume_id == r_id)
            )
            remaining_apps = count_res.scalar()

            if remaining_apps == 0:
                resume_res = await session.execute(select(Resume).where(Resume.id == r_id))
                resume = resume_res.scalar_one_or_none()

                if resume:
                    # 1. Delete physical file from disk
                    try:
                        if os.path.exists(resume.file_path):
                            os.remove(resume.file_path)
                            print(f"[INFO] Deleted resume file: {resume.file_path}")
                    except Exception as e:
                        print(f"[WARN] Failed to delete resume file {resume.file_path}: {e}")

                    # 2. Delete from Elasticsearch index
                    await delete_resume_from_index(r_id)

                    # 3. Delete DB record
                    await session.delete(resume)
                    orphaned_resumes_count += 1

        if orphaned_resumes_count > 0:
            await session.commit()
            print(f"[INFO] Deleted {orphaned_resumes_count} orphaned resumes.")

    print("[INFO] 7-day retention cleanup complete.")

