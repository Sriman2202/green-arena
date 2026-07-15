import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="font-heading text-lg font-bold text-foreground">Green Arena</p>
          <p>Book a turf near you in seconds.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/turfs" className="hover:text-foreground">Find Turfs</Link>
          <Link href="/signup" className="hover:text-foreground">Sign up</Link>
          <Link href="/login" className="hover:text-foreground">Log in</Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} Green Arena. All rights reserved.</p>
      </div>
    </footer>
  );
}
