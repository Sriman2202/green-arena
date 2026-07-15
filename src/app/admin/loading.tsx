export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border border-border bg-muted" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-border bg-muted" />
    </div>
  );
}
