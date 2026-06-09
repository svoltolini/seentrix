import { requirePlatformStaff } from "@/lib/admin/access";
import { AdminNav } from "./admin-nav";

export const runtime = "nodejs";

/**
 * Internal admin console shell. Gating happens here, once, for every
 * /app/admin/* page: a non-staff session 404s before any child renders.
 * (The /app middleware has already guaranteed auth + MFA by this point.)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requirePlatformStaff();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-l6-plus uppercase tracking-[0.18em] text-primary">
            Seentrix · internal
          </span>
          <h1 className="font-heading text-h2 text-foreground">
            Admin console
          </h1>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-l6-plus uppercase tracking-wide text-muted-foreground">
          {staff.role === "owner" ? "Owner" : "Staff"} · {staff.email}
        </span>
      </header>

      <AdminNav />

      <div>{children}</div>
    </div>
  );
}

export const metadata = { title: "Admin console" };
