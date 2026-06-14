export default function ListAnalyticsLoading() {
  return (
    <div className="relative px-4 pb-16 pt-8 sm:px-6 lg:px-10 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-12 rounded-lg bg-muted" />
        <div className="h-8 w-28 sm:w-32 rounded-xl bg-muted" />
        <div className="h-4 w-40 sm:w-52 rounded-lg bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5 space-y-3"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-muted" />
            <div className="h-6 sm:h-7 w-12 sm:w-14 rounded-lg bg-muted" />
            <div className="h-3 w-20 sm:w-24 rounded-full bg-muted" />
            <div className="hidden sm:block h-3 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-28 sm:w-36 rounded-lg bg-muted" />
            <div className="h-3 w-20 sm:w-28 rounded-lg bg-muted" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-8 rounded-lg bg-muted" />
            <div className="h-3 w-8 sm:w-10 rounded-lg bg-muted" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-muted" />
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-muted shrink-0" />
                <div className="h-3 rounded-md bg-muted" style={{ width: `${40 + i * 14}px` }} />
                <div className="h-3 w-4 rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="h-8 w-32 sm:w-40 rounded-xl bg-muted" />
            <div className="h-8 w-14 sm:w-16 rounded-xl bg-muted" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-4 w-28 sm:w-36 rounded-lg bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
        </div>
        <div className="flex items-end gap-1.5 sm:gap-2 h-48 sm:h-64 pt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-t-sm bg-muted"
                  style={{ height: `${12 + (i + j) * 6}px` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 space-y-4">
        <div className="h-4 w-24 sm:w-28 rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2.5 w-2.5 rounded-full bg-muted shrink-0" />
                  <div className="h-4 rounded-lg bg-muted" style={{ width: `${56 + i * 16}px` }} />
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="hidden sm:block h-3 w-8 rounded-full bg-muted" />
                  <div className="h-4 w-6 rounded-lg bg-muted" />
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
