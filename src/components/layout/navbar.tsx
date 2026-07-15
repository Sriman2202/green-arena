import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AdminNavLink } from "@/components/layout/admin-nav-link";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-heading text-2xl font-bold tracking-tight">
          Green Arena
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          {session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN" ? (
            <AdminNavLink />
          ) : (
            <>
              <Link href="/turfs" className="text-foreground/80 transition-colors hover:text-foreground">
                Find Turfs
              </Link>
              {session?.user && (
                <Link href="/bookings" className="text-foreground/80 transition-colors hover:text-foreground">
                  My Bookings
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Log in
              </Button>
              <Button size="sm" render={<Link href="/signup" />}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
