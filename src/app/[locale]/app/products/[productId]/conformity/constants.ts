// Plain constants for the conformity surface — kept out of
// `actions.ts` because Next.js "use server" files can only export
// async functions (exporting a primitive trips a build-time error).
// Both the client component and the server action import from here.

/** Max upload size for a step attachment — mirrors the bucket cap. */
export const STEP_ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

/** Accepted MIME types — mirrored from the storage bucket allowlist
 *  (`supabase/migrations/00037_conformity_step_attachments.sql`). */
export const STEP_ATTACHMENT_ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
] as const;
