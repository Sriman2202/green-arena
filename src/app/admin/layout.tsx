import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Admin</h1>
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/admin" className="text-foreground/80 hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/admin/turfs" className="text-foreground/80 hover:text-foreground">
            Turfs
          </Link>
          <Link href="/admin/bookings" className="text-foreground/80 hover:text-foreground">
            Bookings
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
