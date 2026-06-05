-- =============================================================================
-- 00038: Tighten chat_feedback UPDATE policy to the session-ownership scope
--
-- The chat_feedback SELECT and INSERT policies (00035) both require that the
-- row's session_id belongs to the caller's own (org_id, user_id) pair:
--
--   user_id = auth.uid()
--   AND session_id IN (SELECT id FROM chat_sessions
--                      WHERE org_id = <jwt org> AND user_id = auth.uid())
--
-- The UPDATE policy, however, only checks `user_id = auth.uid()` in both its
-- USING and WITH CHECK clauses. That is asymmetric: it gates the row on the
-- caller's user id but not on the session belonging to the caller's org. The
-- blanket backfill in 00032 did not cover this because 00035 (which created
-- chat_feedback) ran *after* 00032 and shipped its own explicit WITH CHECK.
--
-- In practice cross-tenant writes are already blocked by the INSERT WITH CHECK
-- (an upsert referencing a foreign session_id can never create the row in the
-- first place), so this is not known to be exploitable today. But a policy
-- that names a column the sibling policies guard, yet omits the guard, is a
-- latent isolation gap in a compliance product: any future code path that
-- reaches the UPDATE branch on a pre-existing row would not be re-checked
-- against the session's org. This migration makes the UPDATE policy's scope
-- identical to SELECT/INSERT so the three are symmetric.
--
-- Idempotent: ALTER POLICY is a no-op-safe in-place rewrite; re-running it
-- simply sets the same clauses again.
-- =============================================================================

ALTER POLICY "chat_feedback_update" ON public.chat_feedback
  USING (
    user_id = auth.uid()
    AND session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND session_id IN (
      SELECT id FROM public.chat_sessions
      WHERE org_id  = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
        AND user_id = auth.uid()
    )
  );
