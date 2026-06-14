export default function TimerLoading() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8">
        <div className="space-y-2">
          <div className="h-3 w-14 sm:w-16 rounded-full bg-muted" />
          <div className="h-5 w-28 sm:w-32 rounded-lg bg-muted" />
        </div>
        <div className="h-9 w-9 rounded-xl bg-muted" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div
          className="relative flex items-center justify-center w-full"
          style={{ maxWidth: 420, aspectRatio: '1' }}
        >
          <svg viewBox="0 0 420 420" className="-rotate-90 w-full h-full">
            <circle
              cx={210}
              cy={210}
              r={186}
              fill="none"
              stroke="currentColor"
              strokeWidth={16}
              className="text-muted/40"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 sm:gap-8">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className="h-4 sm:h-5 w-20 sm:w-24 rounded-full bg-muted" />
              <div className="h-12 sm:h-16 w-40 sm:w-48 rounded-xl bg-muted" />
            </div>
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted" />
              <div className="h-7 sm:h-8 w-24 sm:w-28 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 pb-8 sm:pb-10">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
          <div className="h-3 w-10 sm:w-12 rounded-full bg-muted" />
          <div className="flex items-center gap-4 sm:gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="h-5 w-10 sm:w-12 rounded-lg bg-muted" />
                <div className="h-2.5 w-12 sm:w-14 rounded-full bg-muted" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {[28, 16, 8].map((w, i) => (
              <div key={i} className="h-1 rounded-full bg-muted" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
