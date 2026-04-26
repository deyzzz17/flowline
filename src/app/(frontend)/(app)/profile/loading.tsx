export default function ProfileLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden animate-pulse">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="h-20 w-20 rounded-full bg-muted" />
          <div className="space-y-2 text-center">
            <div className="h-6 w-32 rounded-lg bg-muted mx-auto" />
            <div className="h-4 w-48 rounded-full bg-muted mx-auto" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-16 rounded-full bg-muted" />
            <div className="h-11 w-full rounded-xl bg-muted" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-12 rounded-full bg-muted" />
            <div className="h-11 w-full rounded-xl bg-muted" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-24 rounded-full bg-muted" />
            <div className="h-11 w-full rounded-xl bg-muted" />
          </div>

          <div className="h-11 w-full rounded-xl bg-muted" />
        </div>

        <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
          <div className="h-4 w-28 rounded-full bg-muted" />
          <div className="h-4 w-64 rounded-full bg-muted" />
          <div className="h-9 w-32 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}