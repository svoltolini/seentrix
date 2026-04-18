import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Pin Turbopack's workspace root to this project dir. Without this, the
// presence of `.claude/worktrees/<branch>/package-lock.json` (Claude Code
// git worktrees living inside the repo) confuses Turbopack into also
// compiling the stale worktree tree, which explodes on any file that
// exists on main but not on the worktree's older branch.
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "accfirbiiejappwqpvwx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
