export default function DashboardLoading() {
  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10 animate-pulse">
      <section className="mb-6 mt-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded-full bg-muted" />
          <div className="h-7 w-56 rounded-xl bg-muted" />
          <div className="h-3.5 w-36 rounded-full bg-muted" />
        </div>
        <div className="h-8 w-28 rounded-xl bg-muted mt-1 shrink-0" />
      </section>

      <section className="mb-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 rounded-full bg-muted" />
              <div className="h-5 w-20 rounded-full bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-muted shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-3/4 rounded-full bg-muted" />
                    <div className="h-3 w-1/2 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 flex flex-col items-center gap-4">
            <div className="h-3.5 w-24 rounded-full bg-muted" />
            <div className="h-28 w-28 rounded-full bg-muted" />
            <div className="w-full space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-10 rounded-full bg-muted" />
                  <div className="flex-1 h-1.5 rounded-full bg-muted" />
                  <div className="h-3 w-7 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 rounded-full bg-muted" />
              <div className="h-5 w-2/3 rounded-lg bg-muted" />
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-muted" />
                <div className="h-5 w-28 rounded-full bg-muted" />
              </div>
            </div>
            <div className="h-9 w-44 rounded-xl bg-muted shrink-0" />
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-muted" />
                <div className="h-3 w-12 rounded-full bg-muted" />
              </div>
              <div className="flex items-end gap-4">
                <div className="space-y-1">
                  <div className="h-7 w-14 rounded-lg bg-muted" />
                  <div className="h-3 w-16 rounded-full bg-muted" />
                </div>
                <div className="space-y-1 pb-0.5">
                  <div className="h-6 w-10 rounded-lg bg-muted" />
                  <div className="h-3 w-12 rounded-full bg-muted" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-20 rounded-full bg-muted" />
                  <div className="h-3 w-8 rounded-full bg-muted" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-muted" />
              <div className="h-4 w-40 rounded-full bg-muted" />
            </div>
            <div className="h-5 w-20 rounded-full bg-muted" />
          </div>
          <div className="divide-y divide-border/40">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-muted shrink-0" />
                <div className="h-4 rounded-full bg-muted" style={{ width: `${60 + i * 10}%` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-44 rounded-full bg-muted" />
              <div className="h-3 w-16 rounded-full bg-muted" />
            </div>
            <div className="h-2 w-full rounded-full bg-muted" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-muted shrink-0" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-20 rounded-full bg-muted" />
                    <div className="h-3 w-14 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-12 rounded-full bg-muted" />
              <div className="h-3 w-24 rounded-full bg-muted" />
            </div>
            <div className="divide-y divide-border/40">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-3 w-12 rounded-full bg-muted shrink-0" />
                  <div className="h-8 w-0.5 rounded-full bg-muted shrink-0" />
                  <div className="h-4 w-24 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-muted" />
              <div className="h-4 w-28 rounded-full bg-muted" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-muted" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-muted shrink-0" />
              <div className="flex-1 h-4 rounded-full bg-muted" />
              <div className="h-1.5 w-28 rounded-full bg-muted shrink-0" />
              <div className="h-3 w-8 rounded-full bg-muted shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
