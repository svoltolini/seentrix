import { requirePlatformStaff } from "@/lib/admin/access";
import { logout } from "@/app/[locale]/auth/actions";
import { Icon } from "@/components/icon";
import { AdminNav } from "./admin-nav";

export const runtime = "nodejs";

/**
 * Internal admin console — a standalone surface, deliberately OUTSIDE the
 * /app customer shell so it has none of the product chrome (no app sidebar
 * or topbar). Gating happens here, once, for every /admin/* page: a non-staff
 * session 404s before any child renders. Auth + MFA + host routing are
 * enforced upstream in middleware.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requirePlatformStaff();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-l6-plus uppercase tracking-[0.18em] text-primary">
              Seentrix · internal
            </span>
            <h1 className="font-heading text-h2 text-foreground">
              Admin console
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-l6-plus uppercase tracking-wide text-muted-foreground">
              {staff.role === "owner" ? "Owner" : "Staff"} · {staff.email}
            </span>
            <form
              action={async () => {
                "use server";
                await logout();
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-l6 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon name="LogoutCurve" size={15} />
                Sign out
              </button>
            </form>
          </div>
        </header>

        <AdminNav />

        <div>{children}</div>
      </div>
    </div>
  );
}

export const metadata = { title: "Admin console" };
