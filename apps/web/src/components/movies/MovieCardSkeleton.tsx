export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-[2/3] animate-pulse bg-border" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-border" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-border" />
        <div className="flex gap-1 mt-1">
          <div className="h-4 w-12 animate-pulse rounded-full bg-border" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-border" />
        </div>
      </div>
    </div>
  )
}
