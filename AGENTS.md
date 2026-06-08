<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Branching & deployment

- **Develop on a feature branch and open every PR into `develop`** — never push or PR directly to `main`. Merging into `develop` is what deploys to **staging** (the staging Vercel deployment + the staging Supabase project), so all work and review happen there first.
- When a change includes a **database migration**, apply it to the **staging** Supabase project after the PR is up, and record it for the eventual production run (see the deployment-checklist issue).
- **Production** (`main` + the production Supabase project) is updated only as a **separate, explicit promotion step**, performed on request — typically a batched promotion that merges `develop` → `main` and then runs the accumulated migrations (in filename order) and any content re-ingests against production. Do not promote to production without being asked.

