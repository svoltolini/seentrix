<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Branching & deployment

Vercel maps the branches like this: **`develop` → Preview**, **`main` → Production**.

- **Develop on a feature branch and open every PR into `develop`** — never push or PR directly to `main`.
- **`develop` → Preview.** Commits on `develop` produce Vercel **Preview** deployments and use the **staging** Supabase project. This is the pre-production environment where all work and review happen first.
- **`main` → Production.** `main` is the Vercel **Production** deployment, backed by the **production** Supabase project.
- When a change includes a **database migration**, apply it to the **staging** Supabase project once the PR is up, and record it for the eventual production run (see the deployment-checklist issue).
- **Production is updated only as a separate, explicit promotion step, performed on request** — typically a batched `develop` → `main` merge followed by running the accumulated migrations (in filename order) and any content re-ingests against production. Do not promote to `main` / production without being asked.

