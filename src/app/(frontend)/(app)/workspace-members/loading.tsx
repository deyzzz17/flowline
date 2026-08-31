export default function WorkspaceMembersLoading() {
  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10 animate-pulse">
      <section className="mb-8 mt-10 space-y-2.5">
        <div className="h-4 w-24 rounded-full bg-muted" />
        <div className="h-8 w-40 rounded-xl bg-muted" />
        <div className="h-4 w-56 rounded-full bg-muted" />
      </section>

      <div className="rounded-2xl border border-border/60 bg-card/40">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
          <div className="h-3.5 w-20 rounded-full bg-muted" />
        </div>
        <div className="p-3 sm:p-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl p-2">
              <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded-full bg-muted" style={{ width: `${50 + i * 10}%` }} />
                <div className="h-3 w-1/3 rounded-full bg-muted" />
              </div>
              <div className="h-5 w-14 rounded-full bg-muted shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
