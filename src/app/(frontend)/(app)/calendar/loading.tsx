export default function CalendarLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-pulse">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
          <div className="h-8 w-16 rounded-xl bg-muted" />
          <div className="h-4 w-36 rounded-lg bg-muted" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-36 rounded-xl bg-muted" />
          <div className="h-8 w-24 rounded-xl bg-muted" />
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border/40">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="py-2 flex justify-center">
            <div className="h-3 w-8 rounded-full bg-muted" />
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[calc((100vh-11rem)/5)] border-b border-r border-border/40 p-1.5 space-y-1.5"
          >
            <div className="h-6 w-6 rounded-full bg-muted" />
            {i % 5 === 0 && <div className="h-5 w-full rounded-md bg-muted" />}
            {i % 7 === 2 && <div className="h-5 w-4/5 rounded-md bg-muted" />}
            {i % 9 === 0 && <div className="h-5 w-3/4 rounded-md bg-muted" />}
            {i % 11 === 1 && (
              <>
                <div className="h-5 w-full rounded-md bg-muted" />
                <div className="h-5 w-2/3 rounded-md bg-muted" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
