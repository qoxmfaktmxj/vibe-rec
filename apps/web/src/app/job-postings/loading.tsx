export default function JobPostingsLoading() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Header placeholder */}
      <div className="sticky top-0 z-50 border-b border-outline-variant bg-background/80 px-6 py-4 md:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="h-7 w-24 animate-pulse rounded-sm bg-surface-container-high" />
          <div className="flex gap-6">
            <div className="h-4 w-16 animate-pulse rounded-sm bg-surface-container-high" />
            <div className="h-4 w-12 animate-pulse rounded-sm bg-surface-container-high" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-16 md:px-16">
        {/* Page title */}
        <div className="mb-10 space-y-3">
          <div className="h-3 w-20 animate-pulse rounded-sm bg-surface-container-high" />
          <div className="h-8 w-48 animate-pulse rounded-sm bg-surface-container-high" />
        </div>

        {/* Search bar */}
        <div className="mb-8 h-12 w-full animate-pulse rounded-sm bg-surface-container-high" />

        {/* Card grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm border border-outline-variant bg-card p-6 space-y-4"
            >
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded-sm bg-surface-container-high" />
                <div className="h-6 w-3/4 animate-pulse rounded-sm bg-surface-container-high" />
              </div>
              <div className="h-4 w-full animate-pulse rounded-sm bg-surface-container-high" />
              <div className="h-4 w-2/3 animate-pulse rounded-sm bg-surface-container-high" />
              <div className="flex gap-2 pt-2">
                <div className="h-5 w-16 animate-pulse rounded-sm bg-surface-container-high" />
                <div className="h-5 w-12 animate-pulse rounded-sm bg-surface-container-high" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
