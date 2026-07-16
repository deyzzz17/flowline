export default function BillingLoading() {
  return (
    <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-10 animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-5 w-16 rounded-lg bg-muted" />
        <div className="h-8 w-40 rounded-xl bg-muted" />
        <div className="h-4 w-56 rounded-full bg-muted" />
      </div>

      <div className="mb-8 flex justify-center">
        <div className="h-11 w-56 rounded-xl bg-muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border border-border/60 bg-card/40 p-6 space-y-5"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 rounded-lg bg-muted" />
                {i === 1 && <div className="h-4 w-12 rounded-full bg-muted" />}
              </div>
              <div className="h-3 w-36 rounded-full bg-muted" />
            </div>

            <div className="space-y-1">
              <div className="h-10 w-24 rounded-lg bg-muted" />
              <div className="h-3 w-32 rounded-full bg-muted" />
            </div>

            <div className="flex-1 space-y-2.5">
              {[...Array(i === 0 ? 7 : i === 1 ? 6 : 5)].map((_, j) => (
                <div key={j} className="flex items-center gap-2.5">
                  <div className="h-4 w-4 shrink-0 rounded bg-muted" />
                  <div className="h-3 rounded-full bg-muted" style={{ width: `${55 + j * 7}%` }} />
                </div>
              ))}
            </div>

            <div className="h-10 w-full rounded-xl bg-muted" />
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <div className="h-3 w-64 rounded-full bg-muted" />
      </div>
    </div>
  )
}
