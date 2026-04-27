"use client";
import { useRouter } from "next/navigation";

export default function AdminLogout() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="type-label"
      style={{ color: "#666", background: "none", border: "none", cursor: "pointer" }}
    >
      Odhlásit
    </button>
  );
}
