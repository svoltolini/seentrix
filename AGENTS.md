<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Branching & deployment

Two long-lived branches, mapped to Vercel environments. Don't create per-task feature branches.

- **`develop` → Preview (testing).** This is the single working/testing branch. **Commit work directly to `develop`** and push it; that produces the Preview deployment to test on, backed by the **staging** Supabase project.
- **`main` → Production.** Updated only by an **explicit, on-request promotion** (merge `develop` → `main`). After promoting, run the accumulated migrations (in filename order) and any content re-ingests against the **production** Supabase project. Never push to `main` or promote without being asked.
- When a change includes a **database migration**, apply it to the **staging** Supabase project after pushing to `develop`, and record it for the eventual production run (see the deployment-checklist issue).

