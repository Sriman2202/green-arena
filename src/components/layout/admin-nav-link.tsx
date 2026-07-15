"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <Link href="/admin" className="text-foreground/80 transition-colors hover:text-foreground">
      Dashboard
    </Link>
  );
}
