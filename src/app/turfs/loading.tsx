export default function TurfsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-border p-3">
            <div className="aspect-[16/10] animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
