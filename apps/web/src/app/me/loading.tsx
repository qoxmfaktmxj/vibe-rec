export default function MyPageLoading() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-on-surface md:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Profile header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-3 w-28 animate-pulse rounded-sm bg-surface-container-high" />
            <div className="h-10 w-48 animate-pulse rounded-sm bg-surface-container-high" />
            <div className="h-4 w-72 animate-pulse rounded-sm bg-surface-container-high" />
          </div>
          <div className="h-9 w-20 animate-pulse rounded-sm bg-surface-container-high" />
        </div>

        {/* Account info card */}
        <div className="rounded-sm border border-outline-variant bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded-sm bg-surface-container-high" />
                <div className="h-4 w-40 animate-pulse rounded-sm bg-surface-container-high" />
              </div>
            ))}
          </div>
        </div>

        {/* Applications section */}
        <div className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded-sm bg-surface-container-high" />
              <div className="h-9 w-36 animate-pulse rounded-sm bg-surface-container-high" />
              <div className="h-4 w-32 animate-pulse rounded-sm bg-surface-container-high" />
            </div>
            <div className="h-9 w-28 animate-pulse rounded-sm bg-surface-container-high" />
          </div>

          <div className="rounded-sm border border-outline-variant bg-card p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-outline-variant/50 pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-2">
                    <div className="h-5 w-48 animate-pulse rounded-sm bg-surface-container-high" />
                    <div className="h-3 w-32 animate-pulse rounded-sm bg-surface-container-high" />
                  </div>
                  <div className="h-6 w-16 animate-pulse rounded-sm bg-surface-container-high" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
