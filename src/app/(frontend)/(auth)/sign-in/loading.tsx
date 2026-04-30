export default function SignInLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-pulse space-y-6">

        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-muted" />
          <div className="h-5 w-24 rounded-lg bg-muted" />
          <div className="h-3.5 w-40 rounded-lg bg-muted" />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="h-3.5 w-12 rounded-md bg-muted" />
            <div className="h-10 w-full rounded-xl bg-muted" />
          </div>

          <div className="space-y-1.5">
            <div className="h-3.5 w-20 rounded-md bg-muted" />
            <div className="h-10 w-full rounded-xl bg-muted" />
          </div>

          <div className="flex justify-end">
            <div className="h-3 w-28 rounded-md bg-muted" />
          </div>

          <div className="h-10 w-full rounded-xl bg-muted" />
        </div>

        <div className="flex justify-center gap-1.5">
          <div className="h-3 w-28 rounded-md bg-muted" />
          <div className="h-3 w-16 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}