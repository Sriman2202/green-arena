export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-muted-foreground sm:px-6">
        <p>&copy; {new Date().getFullYear()} Green Arena. All rights reserved.</p>
      </div>
    </footer>
  );
}
