export default function AdminApplicantsLoading() {
  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="space-y-3">
        <div className="h-3 w-16 animate-pulse rounded-sm bg-surface-container-high" />
        <div className="h-8 w-48 animate-pulse rounded-sm bg-surface-container-high" />
        <div className="h-4 w-64 animate-pulse rounded-sm bg-surface-container-high" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-40 animate-pulse rounded-sm bg-surface-container-high" />
        ))}
        <div className="h-10 flex-1 min-w-[200px] animate-pulse rounded-sm bg-surface-container-high" />
      </div>

      {/* Table */}
      <div className="rounded-sm border border-outline-variant bg-card overflow-hidden">
        <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4">
          <div className="flex gap-6">
            {["지원자", "공고", "지원 상태", "검토 상태", "최근 활동", "열기"].map((label) => (
              <div key={label} className="h-3 w-16 animate-pulse rounded-sm bg-surface-container-high" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-outline-variant/50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 items-start gap-4 px-6 py-5">
              {/* Applicant */}
              <div className="space-y-2">
                <div className="h-5 w-24 animate-pulse rounded-sm bg-surface-container-high" />
                <div className="h-3 w-36 animate-pulse rounded-sm bg-surface-container-high" />
                <div className="h-3 w-28 animate-pulse rounded-sm bg-surface-container-high" />
              </div>
              {/* Job posting */}
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded-sm bg-surface-container-high" />
                <div className="h-3 w-20 animate-pulse rounded-sm bg-surface-container-high" />
              </div>
              {/* Status badges */}
              <div className="h-6 w-20 animate-pulse rounded-sm bg-surface-container-high" />
              <div className="h-6 w-20 animate-pulse rounded-sm bg-surface-container-high" />
              {/* Timestamp */}
              <div className="space-y-1">
                <div className="h-4 w-32 animate-pulse rounded-sm bg-surface-container-high" />
                <div className="h-3 w-36 animate-pulse rounded-sm bg-surface-container-high" />
              </div>
              {/* Button */}
              <div className="flex justify-end">
                <div className="h-8 w-12 animate-pulse rounded-sm bg-surface-container-high" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-outline-variant pt-4">
        <div className="h-4 w-32 animate-pulse rounded-sm bg-surface-container-high" />
        <div className="flex gap-3">
          <div className="h-10 w-16 animate-pulse rounded-sm bg-surface-container-high" />
          <div className="h-10 w-12 animate-pulse rounded-sm bg-surface-container-high" />
          <div className="h-10 w-16 animate-pulse rounded-sm bg-surface-container-high" />
        </div>
      </div>
    </div>
  );
}
