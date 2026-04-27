import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLogout from "./AdminLogout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  // Allow access to login page without auth
  // (handled in the login page itself)

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      {authed && (
        <>
          {/* Admin nav */}
          <div className="bar bar-thick" style={{ background: "var(--dpp)" }} />
          <header
            className="flex items-center justify-between px-6 py-4 border-b-4"
            style={{ borderColor: "#fff" }}
          >
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="type-label no-underline"
                style={{ color: "var(--dpp)", letterSpacing: "0.16em" }}
              >
                O ADMIN
              </Link>
              <div
                className="h-4 w-px"
                style={{ background: "#333" }}
              />
              <Link
                href="/admin/vystavy"
                className="type-label no-underline"
                style={{ color: "#fff" }}
              >
                Výstavy
              </Link>
              <Link
                href="/admin/vystavy/nova"
                className="type-label no-underline"
                style={{ color: "#aaa" }}
              >
                + Nová výstava
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="type-label no-underline"
                style={{ color: "#666" }}
              >
                ← Web
              </Link>
              <AdminLogout />
            </div>
          </header>
        </>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
