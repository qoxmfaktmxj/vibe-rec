const pulseClass = "motion-safe:animate-pulse motion-reduce:animate-none";

export default function JobPostingsLoading() {
  return (
    <div
      className="min-h-screen bg-background text-on-surface"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">채용 공고를 불러오는 중입니다.</span>

      <div className="sticky top-0 z-50 border-b border-outline-variant bg-card px-6 py-4 md:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className={`${pulseClass} h-8 w-32 rounded-md bg-surface-container-high`} />
          <div className="flex gap-3">
            <div className={`${pulseClass} h-11 w-24 rounded-full bg-surface-container-high`} />
            <div className={`${pulseClass} h-11 w-20 rounded-full bg-surface-container-high`} />
          </div>
        </div>
      </div>

      <main id="main-content" tabIndex={-1}>
        <section className="job-browser-hero px-6 py-16 md:px-16 md:py-24">
          <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)] lg:items-end">
            <div className="space-y-5">
              <div className={`${pulseClass} h-16 w-full max-w-3xl rounded-md bg-signal-foreground/15 md:h-24`} />
              <div className={`${pulseClass} h-5 w-full max-w-xl rounded-md bg-signal-foreground/15`} />
            </div>
            <div className="border-t border-signal-border pt-6 lg:border-l lg:border-t-0 lg:pl-7">
              <div className={`${pulseClass} h-20 w-28 rounded-md bg-signal-accent/25`} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-16 md:py-24">
          <div className="job-filter-shell border-y border-outline-variant py-6">
            <div className={`${pulseClass} h-5 w-40 rounded-md bg-surface-container-high`} />
            <div className="mt-5 flex flex-wrap gap-2">
              <div className={`${pulseClass} h-11 w-20 rounded-full bg-surface-container-high`} />
              <div className={`${pulseClass} h-11 w-20 rounded-full bg-surface-container-high`} />
              <div className={`${pulseClass} h-11 w-32 rounded-full bg-surface-container-high`} />
            </div>
          </div>

          <div className="mt-16 border-t-2 border-on-surface">
            <div className="flex items-center justify-between py-6">
              <div className={`${pulseClass} h-9 w-36 rounded-md bg-surface-container-high`} />
              <div className={`${pulseClass} h-4 w-28 rounded-md bg-surface-container-high`} />
            </div>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="grid min-h-40 gap-5 border-t border-outline-variant py-7 md:grid-cols-[3rem_minmax(0,1.35fr)_minmax(15rem,0.75fr)_3rem] md:items-center md:px-5"
              >
                <div className={`${pulseClass} h-3 w-5 rounded-sm bg-surface-container-high`} />
                <div className="space-y-4">
                  <div className={`${pulseClass} h-3 w-32 rounded-sm bg-surface-container-high`} />
                  <div className={`${pulseClass} h-8 w-3/4 rounded-md bg-surface-container-high`} />
                  <div className={`${pulseClass} h-4 w-full max-w-xl rounded-sm bg-surface-container-high`} />
                </div>
                <div className="space-y-3">
                  <div className={`${pulseClass} h-4 w-2/3 rounded-sm bg-surface-container-high`} />
                  <div className={`${pulseClass} h-4 w-3/4 rounded-sm bg-surface-container-high`} />
                </div>
                <div className={`${pulseClass} h-11 w-11 rounded-full bg-surface-container-high`} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
