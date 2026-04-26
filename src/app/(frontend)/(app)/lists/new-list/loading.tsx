export default function NewListLoading() {
  return (
    <div className="mx-auto max-w-lg mt-10 animate-pulse">
      <div className="mb-8 space-y-2.5">
        <div className="h-5 w-12 rounded-full bg-muted" />
        <div className="h-8 w-32 rounded-xl bg-muted" />
        <div className="h-4 w-64 rounded-full bg-muted" />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-12 rounded-full bg-muted" />
          <div className="h-11 w-full rounded-xl bg-muted" />
        </div>

        <div className="space-y-2">
          <div className="h-4 w-20 rounded-full bg-muted" />
          <div className="h-11 w-full rounded-xl bg-muted" />
        </div>

        <div className="space-y-3">
          <div className="h-4 w-12 rounded-full bg-muted" />
          <div className="flex flex-wrap gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-muted" />
            ))}
            <div className="h-8 w-8 rounded-full bg-muted" />
          </div>
          <div className="h-9 w-36 rounded-xl bg-muted" />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <div className="h-10 w-20 rounded-xl bg-muted" />
        <div className="h-10 w-32 rounded-xl bg-muted" />
      </div>
    </div>
  )
}
