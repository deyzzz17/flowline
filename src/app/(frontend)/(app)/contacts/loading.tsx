export default function ContactsLoading() {
  return (
    <div className="relative px-4 pb-16 pt-8 sm:px-6 lg:px-10 animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-28 rounded-lg bg-muted" />
        <div className="h-4 w-56 rounded-full bg-muted" />
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <div className="h-11 w-full rounded-xl bg-muted" />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
          <div className="divide-y divide-border/30">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3.5 w-28 rounded bg-muted" />
                  <div className="h-3 w-36 rounded bg-muted" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="h-8 w-8 rounded-lg bg-muted" />
                  <div className="h-8 w-8 rounded-lg bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
          <div className="divide-y divide-border/30">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                <div
                  className="flex-1 h-3.5 rounded bg-muted"
                  style={{ maxWidth: `${50 + i * 10}%` }}
                />
                <div className="h-3 w-12 rounded bg-muted shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
          <div className="border-t border-border/50 divide-y divide-border/30">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3.5 rounded bg-muted" style={{ width: `${40 + i * 6}%` }} />
                  <div className="h-3 rounded bg-muted" style={{ width: `${50 + i * 5}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
