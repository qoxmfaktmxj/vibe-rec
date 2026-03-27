export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* Page title area */}
      <div className="space-y-3">
        <div className="h-3 w-20 animate-pulse rounded-sm bg-surface-container-high" />
        <div className="h-8 w-56 animate-pulse rounded-sm bg-surface-container-high" />
        <div className="h-4 w-80 animate-pulse rounded-sm bg-surface-container-high" />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-sm border border-outline-variant bg-card p-6 space-y-3">
            <div className="h-3 w-24 animate-pulse rounded-sm bg-surface-container-high" />
            <div className="h-10 w-20 animate-pulse rounded-sm bg-surface-container-high" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-sm border border-outline-variant bg-card overflow-hidden">
        <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4">
          <div className="flex gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 w-16 animate-pulse rounded-sm bg-surface-container-high" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-outline-variant/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-6 py-5">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-32 animate-pulse rounded-sm bg-surface-container-high" />
                <div className="h-3 w-48 animate-pulse rounded-sm bg-surface-container-high" />
              </div>
              <div className="h-5 w-40 animate-pulse rounded-sm bg-surface-container-high" />
              <div className="h-6 w-16 animate-pulse rounded-sm bg-surface-container-high" />
              <div className="h-6 w-16 animate-pulse rounded-sm bg-surface-container-high" />
              <div className="h-3 w-28 animate-pulse rounded-sm bg-surface-container-high" />
              <div className="h-8 w-12 animate-pulse rounded-sm bg-surface-container-high" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
