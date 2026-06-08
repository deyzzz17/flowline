export default function HabitsViewLoading() {
  return (
    <div className="pt-8 animate-pulse">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
          <div className="h-7 w-40 rounded-lg bg-muted" />
          <div className="mt-1 h-4 w-32 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-8 w-24 rounded-lg bg-muted" />
          <div className="h-8 w-24 rounded-lg bg-muted" />
          <div className="h-8 w-28 rounded-lg bg-muted" />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="h-3 w-12 rounded bg-muted" />
        <div className="h-5 w-10 rounded-full bg-muted" />
      </div>
      <div className="mb-4 h-1.5 w-full rounded-full bg-muted" />

      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="relative rounded-2xl border border-border/60 bg-background p-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-5 w-12 rounded-full bg-muted" />
                </div>
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="h-11 w-11 shrink-0 rounded-full bg-muted" />
              <div className="flex items-center gap-0.5">
                <div className="h-7 w-7 rounded-lg bg-muted" />
                <div className="h-7 w-7 rounded-lg bg-muted" />
                <div className="h-7 w-7 rounded-lg bg-muted" />
              </div>
            </div>
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}