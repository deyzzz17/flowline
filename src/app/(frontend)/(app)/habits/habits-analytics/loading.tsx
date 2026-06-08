export default function HabitsAnalyticsLoading() {
  return (
    <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-10 animate-pulse">
      <div className="mb-6 h-4 w-20 rounded bg-muted" />

      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        <div className="h-7 w-40 rounded-lg bg-muted" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-2">
            <div className="h-7 w-7 rounded-lg bg-muted" />
            <div className="h-6 w-12 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="mb-6 flex justify-center">
        <div className="h-3 w-48 rounded bg-muted" />
      </div>

      <div className="mb-6 h-36 rounded-2xl bg-muted" />

      <div className="mb-6 h-48 rounded-2xl bg-muted" />

      <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4">
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
        <div className="divide-y divide-border/30">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-2.5 w-2.5 rounded-full bg-muted shrink-0" />
              <div className="flex-1 h-4 rounded bg-muted" />
              <div className="h-4 w-8 rounded bg-muted shrink-0" />
              <div className="w-16 h-1.5 rounded-full bg-muted shrink-0" />
              <div className="w-10 h-3 rounded bg-muted shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}