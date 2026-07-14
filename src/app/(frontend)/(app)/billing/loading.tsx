export default function BillingLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 lg:px-10 animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-5 w-16 rounded-lg bg-muted" />
        <div className="h-8 w-48 rounded-xl bg-muted" />
        <div className="h-4 w-64 rounded-full bg-muted" />
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded-full bg-muted" />
              <div className="h-8 w-24 rounded-lg bg-muted" />
            </div>
            <div className="h-8 w-28 rounded-xl bg-muted shrink-0" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-7 w-24 rounded-full bg-muted" />
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="h-9 w-48 rounded-xl bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6 space-y-5"
            >
              <div className="space-y-2">
                <div className="h-4 w-16 rounded-lg bg-muted" />
                <div className="h-8 w-20 rounded-lg bg-muted" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div
                    key={j}
                    className="h-4 rounded-full bg-muted"
                    style={{ width: `${60 + j * 8}%` }}
                  />
                ))}
              </div>
              <div className="h-10 w-full rounded-xl bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
