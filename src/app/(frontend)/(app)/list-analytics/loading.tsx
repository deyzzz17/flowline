export default function ListAnalyticsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-xl bg-muted" />
        <div className="h-4 w-36 rounded-lg bg-muted" />
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/40 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-24 rounded-lg bg-muted" />
            <div className="h-3 w-40 rounded-lg bg-muted" />
          </div>
          <div className="h-6 w-28 rounded-lg bg-muted" />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="h-40 w-40 rounded-full bg-muted" />
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-muted" />
                <div className="h-3 rounded-md bg-muted" style={{ width: `${48 + i * 12}px` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/40 p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-8 w-40 rounded-xl bg-muted" />
            <div className="h-8 w-16 rounded-xl bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-4 w-36 rounded-lg bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
        </div>

        <div className="flex items-end gap-2 h-64 pt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-1">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-t-sm bg-muted"
                  style={{ height: `${20 + Math.random() * 60}px` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
