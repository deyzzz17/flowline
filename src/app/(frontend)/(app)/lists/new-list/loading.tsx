export default function ListLoading() {
  return (
    <div className="relative mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-10 animate-pulse">
      <section className="mb-8 mt-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-muted" />
              <div className="h-4 w-16 rounded-full bg-muted" />
            </div>
            <div className="h-8 w-48 rounded-xl bg-muted" />
            <div className="h-4 w-64 rounded-full bg-muted" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1">
              <div className="h-8 w-8 rounded-xl bg-muted" />
              <div className="h-8 w-8 rounded-xl bg-muted" />
            </div>
            <div className="h-1.5 w-32 rounded-full bg-muted" />
          </div>
        </div>
      </section>

      <div className="mb-8 h-10 w-full rounded-xl bg-muted sm:w-80" />

      <div className="mb-6 flex items-end justify-between">
        <div className="space-y-1.5">
          <div className="h-5 w-20 rounded-lg bg-muted" />
          <div className="h-4 w-40 rounded-full bg-muted" />
        </div>
        <div className="h-12 w-36 rounded-xl bg-muted" />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
          <div className="h-3.5 w-24 rounded-full bg-muted" />
          <div className="h-5 w-8 rounded-full bg-muted" />
        </div>
        <div className="p-3 sm:p-5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border/40 p-3 sm:p-4"
            >
              <div className="mt-1 h-4 w-4 rounded bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded-full bg-muted" style={{ width: `${60 + i * 8}%` }} />
                <div className="h-3 w-1/3 rounded-full bg-muted" />
              </div>
              <div className="flex gap-1 shrink-0">
                <div className="h-7 w-7 rounded-lg bg-muted" />
                <div className="h-7 w-7 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
