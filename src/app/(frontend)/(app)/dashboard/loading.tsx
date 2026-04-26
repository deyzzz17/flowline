export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-10 animate-pulse">
      <section className="mb-5 mt-10 space-y-2">
        <div className="h-5 w-24 rounded-full bg-muted" />
        <div className="h-4 w-72 rounded-full bg-muted" />
      </section>

      <div className="mb-8 h-24 rounded-2xl bg-muted" />

      <section className="mb-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-muted" />
                <div className="h-3 w-4 rounded-full bg-muted" />
              </div>
              <div className="h-7 w-16 rounded-lg bg-muted" />
              <div className="h-3 w-24 rounded-full bg-muted" />
              <div className="h-3 w-20 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border/60 bg-card/40">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="h-4 w-28 rounded-full bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border/40 p-4"
                >
                  <div className="h-4 w-4 rounded bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-4 rounded-full bg-muted"
                      style={{ width: `${55 + i * 12}%` }}
                    />
                    <div className="h-3 w-1/4 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 p-4"
              >
                <div className="h-8 w-8 rounded-xl bg-muted shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-20 rounded-full bg-muted" />
                  <div className="h-3 w-16 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/40">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="h-4 w-16 rounded-full bg-muted" />
              <div className="h-5 w-24 rounded-full bg-muted" />
            </div>
            <div className="p-5 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-3 w-28 rounded-full bg-muted" />
                    <div className="h-3 w-8 rounded-full bg-muted" />
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="h-4 w-12 rounded-full bg-muted" />
              <div className="h-3 w-24 rounded-full bg-muted" />
            </div>
            <div className="divide-y divide-border/30">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-2 w-2 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 h-4 rounded-full bg-muted" />
                  <div className="h-3 w-10 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-32 rounded-full bg-muted" />
              <div className="h-3 w-8 rounded-full bg-muted" />
            </div>
            <div className="flex items-end gap-1.5" style={{ height: 56 }}>
              {[40, 65, 50, 80, 70, 90, 55].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-sm bg-muted"
                    style={{ height: `${(h / 100) * 48}px` }}
                  />
                  <div className="h-2 w-2 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
