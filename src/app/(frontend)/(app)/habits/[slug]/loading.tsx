export default function HabitDetailLoading() {
  return (
    <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-10 animate-pulse">
      <div className="mb-6 h-4 w-20 rounded bg-muted" />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
          <div className="h-7 w-48 rounded-lg bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-muted shrink-0" />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-card/40 p-4 text-center space-y-2"
          >
            <div className="mx-auto h-8 w-8 rounded-xl bg-muted" />
            <div className="mx-auto h-6 w-16 rounded bg-muted" />
            <div className="mx-auto h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="mb-4 h-4 w-32 rounded bg-muted" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-16 h-3 rounded bg-muted shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-muted" />
              <div className="w-10 h-3 rounded bg-muted shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-4 w-36 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="grid grid-cols-7 gap-0.5">
                {[...Array(35)].map((_, j) => (
                  <div key={j} className="h-7 w-7 rounded-full bg-muted mx-auto" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
