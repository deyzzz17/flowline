export default function ProfileLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden animate-pulse">
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        <div className="flex flex-col items-center gap-4 mb-8 sm:mb-10">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted" />
          <div className="space-y-2 text-center">
            <div className="h-6 w-28 sm:w-32 rounded-lg bg-muted mx-auto" />
            <div className="h-4 w-40 sm:w-48 rounded-full bg-muted mx-auto" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-16 rounded-full bg-muted" />
            <div className="h-11 w-full rounded-xl bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-12 rounded-full bg-muted" />
            <div className="h-11 w-full rounded-xl bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 sm:w-24 rounded-full bg-muted" />
            <div className="h-11 w-full rounded-xl bg-muted" />
          </div>
          <div className="h-11 w-full rounded-xl bg-muted" />
        </div>

        <div className="mt-4 sm:mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:p-6 space-y-4">
          <div className="h-4 w-24 sm:w-28 rounded-full bg-muted" />
          <div className="h-4 w-48 sm:w-64 rounded-full bg-muted" />
          <div className="h-9 w-28 sm:w-32 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
