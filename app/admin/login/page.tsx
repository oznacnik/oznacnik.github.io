"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Špatné přihlašovací údaje");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div className="bar bar-thick" style={{ background: "var(--dpp)", marginBottom: "2rem" }} />

        <div
          className="font-black uppercase text-white mb-8"
          style={{ fontSize: "clamp(32px, 8vw, 56px)", letterSpacing: "-0.03em", lineHeight: 0.9 }}
        >
          O<br />ADMIN
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="type-label block mb-2" style={{ color: "#666" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 type-label"
              style={{
                background: "#111",
                border: "4px solid #333",
                color: "#fff",
                outline: "none",
                fontFamily: "inherit",
              }}
              placeholder="admin@tramgallery.cz"
            />
          </div>

          <div>
            <label className="type-label block mb-2" style={{ color: "#666" }}>
              Heslo
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 type-label"
              style={{
                background: "#111",
                border: "4px solid #333",
                color: "#fff",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {error && (
            <div className="type-label" style={{ color: "var(--dpp)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 type-label font-black"
            style={{
              background: loading ? "#333" : "var(--dpp)",
              color: "#fff",
              border: "none",
              cursor: loading ? "default" : "pointer",
              letterSpacing: "0.16em",
              fontFamily: "inherit",
              marginTop: "0.5rem",
            }}
          >
            {loading ? "..." : "Přihlásit se"}
          </button>
        </form>

        <div className="bar bar-thick mt-8" style={{ background: "#222" }} />
      </div>
    </div>
  );
}
