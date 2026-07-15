export default function TurfDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="aspect-[16/10] animate-pulse rounded-xl bg-muted" />
        <div className="aspect-[16/10] animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
