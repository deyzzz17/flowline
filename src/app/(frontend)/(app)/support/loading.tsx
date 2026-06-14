export default function SupportLoading() {
  return (
    <div className="mx-auto max-w-2xl mt-10 pb-16 px-4 sm:px-6 animate-pulse">
      <div className="mb-8 sm:mb-10 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-4 w-16 rounded-full bg-muted" />
        </div>
        <div className="h-8 w-48 sm:w-56 rounded-xl bg-muted" />
        <div className="h-4 w-56 sm:w-72 rounded-full bg-muted" />
      </div>

      <div className="mb-8 sm:mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3.5"
          >
            <div className="h-9 w-9 rounded-lg bg-muted shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <div className="h-4 w-20 sm:w-24 rounded-full bg-muted" />
              <div className="h-3 w-28 sm:w-32 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 space-y-1.5">
        <div className="h-5 w-40 sm:w-48 rounded-lg bg-muted" />
        <div className="h-4 w-52 sm:w-64 rounded-full bg-muted" />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden divide-y divide-border/50">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 sm:px-5 py-4 gap-4">
            <div
              className="h-4 rounded-full bg-muted flex-1"
              style={{ maxWidth: `${45 + i * 4}%` }}
            />
            <div className="h-4 w-4 rounded bg-muted shrink-0" />
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 sm:px-6 py-8">
        <div className="h-11 w-11 rounded-2xl bg-muted" />
        <div className="h-4 w-32 sm:w-36 rounded-full bg-muted" />
        <div className="h-4 w-48 sm:w-56 rounded-full bg-muted" />
        <div className="h-9 w-24 sm:w-28 rounded-xl bg-muted mt-1" />
      </div>
    </div>
  )
}
