export default function TeamsLoading() {
  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10 animate-pulse">
      <section className="mb-8 mt-10 space-y-2.5">
        <div className="h-4 w-24 rounded-full bg-muted" />
        <div className="h-8 w-40 rounded-xl bg-muted" />
        <div className="h-4 w-56 rounded-full bg-muted" />
      </section>

      <div className="rounded-3xl bg-card p-16 shadow-lg shadow-black/5">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-muted" />
      </div>
    </div>
  )
}
