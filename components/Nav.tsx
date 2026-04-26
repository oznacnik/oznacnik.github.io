"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Výstavy" },
  { href: "/o-galerii", label: "O galerii" },
];

export default function Nav() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return null;

  return (
    <>
      <div className="bar bar-thick" />
      <header className="flex items-center justify-between px-6 py-4 border-b-4 border-black">
        <Link href="/" className="flex items-center gap-4 no-underline">
          <span
            className="type-label"
            style={{ fontSize: 10, letterSpacing: "0.16em" }}
          >
            Galerie Označník
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${(l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)) ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
