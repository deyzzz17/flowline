export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10 animate-pulse">
      <div className="mb-8 sm:mb-10 space-y-2 sm:space-y-3">
        <div className="h-3 w-20 sm:w-24 rounded-full bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-3 w-16 rounded-full bg-muted" />
        </div>
        <div className="h-7 w-36 sm:w-40 rounded-xl bg-muted" />
        <div className="hidden sm:block h-4 w-72 rounded-full bg-muted" />
      </div>

      <section className="mb-8 sm:mb-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-muted" />
              <div className="h-3 w-6 sm:w-8 rounded-full bg-muted" />
            </div>
            <div className="h-6 sm:h-7 w-16 sm:w-20 rounded-lg bg-muted" />
            <div className="h-3 w-14 sm:w-16 rounded-full bg-muted" />
            <div className="hidden sm:block h-3 w-24 rounded-full bg-muted" />
          </div>
        ))}
      </section>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 px-4 sm:px-5 py-4">
              <div className="space-y-1.5">
                <div className="h-4 w-28 sm:w-32 rounded-lg bg-muted" />
                <div className="h-3 w-20 sm:w-24 rounded-full bg-muted" />
              </div>
              <div className="h-8 w-full sm:w-48 rounded-xl bg-muted" />
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex items-end gap-2 sm:gap-3 h-44 sm:h-52 pt-4">
                {[60, 85, 40, 70, 50].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <div className="w-full rounded-t-lg bg-muted" style={{ height: `${h}%` }} />
                    <div className="h-2.5 w-6 sm:w-8 rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
            <div className="border-b border-border/50 px-4 sm:px-5 py-4 space-y-1.5">
              <div className="h-4 w-24 sm:w-28 rounded-lg bg-muted" />
              <div className="h-3 w-32 sm:w-36 rounded-full bg-muted" />
            </div>
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-full border-[16px] border-muted bg-background shrink-0" />
              <div className="flex flex-col gap-2.5 flex-1 w-full">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 h-3 rounded-full bg-muted" />
                    <div className="h-3 w-8 sm:w-10 rounded-full bg-muted" />
                    <div className="h-3 w-5 sm:w-6 rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 px-4 sm:px-5 py-4">
            <div className="space-y-1.5">
              <div className="h-4 w-32 sm:w-36 rounded-lg bg-muted" />
              <div className="h-3 w-40 sm:w-48 rounded-full bg-muted" />
            </div>
            <div className="h-8 w-full sm:w-48 rounded-xl bg-muted" />
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-7 w-14 sm:w-16 rounded-full bg-muted" />
              ))}
            </div>
            <div className="flex items-end gap-2 sm:gap-3 h-44 sm:h-48 pt-4">
              {[50, 75, 35, 90, 45, 60, 30].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div className="w-full rounded-t-lg bg-muted" style={{ height: `${h}%` }} />
                  <div className="h-2.5 w-8 sm:w-10 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
          <div className="border-b border-border/50 px-4 sm:px-5 py-4 space-y-1.5">
            <div className="h-4 w-24 sm:w-28 rounded-lg bg-muted" />
            <div className="h-3 w-48 sm:w-56 rounded-full bg-muted" />
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-end gap-2 sm:gap-3 h-44 sm:h-48 pt-4">
              {[76, 82, 70, 88, 64, 80].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div className="w-full rounded-t-lg bg-muted" style={{ height: `${h}%` }} />
                  <div className="h-2.5 w-8 sm:w-10 rounded-full bg-muted" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-border/40 px-3 sm:px-4 py-2 bg-muted/20 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-3 w-12 sm:w-14 rounded-full bg-muted" />
                ))}
              </div>
              <div className="divide-y divide-border/30">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 sm:grid-cols-4 px-3 sm:px-4 py-2.5 gap-3 sm:gap-4 items-center"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted shrink-0" />
                      <div className="h-3 w-14 sm:w-16 rounded-full bg-muted" />
                    </div>
                    <div className="h-3 w-8 sm:w-10 rounded-full bg-muted" />
                    <div className="hidden sm:block h-3 w-8 rounded-full bg-muted" />
                    <div className="hidden sm:block h-3 w-6 rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
