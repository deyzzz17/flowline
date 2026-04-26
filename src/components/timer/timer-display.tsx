'use client'

interface TimerDisplayProps {
  hours: number
  minutes: number
  seconds: number
  isFreeMode: boolean
  isRunning: boolean
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function TimerDisplay({
  hours,
  minutes,
  seconds,
  isFreeMode,
  isRunning,
}: TimerDisplayProps) {
  const showHours = hours > 0

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <span className="rounded-full border border-border/40 bg-background/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 backdrop-blur-sm">
        {isRunning ? 'Focusing' : isFreeMode ? 'Free timer' : 'Ready'}
      </span>

      <div className="flex items-baseline gap-0.5 tabular-nums">
        {showHours && (
          <>
            <span className="text-5xl sm:text-7xl font-extralight tracking-tighter text-foreground leading-none">
              {pad(hours)}
            </span>
            <span className="mx-1 text-2xl font-light text-muted-foreground/40 leading-none">
              :
            </span>
          </>
        )}
        <span className="text-5xl sm:text-7xl font-extralight tracking-tighter text-foreground leading-none">
          {pad(minutes)}
        </span>
        <span className="mx-1 text-2xl font-light text-muted-foreground/40 leading-none">:</span>
        <span className="text-7xl sm:text-7xl font-extralight tracking-tighter text-foreground leading-none">
          {pad(seconds)}
        </span>
      </div>
    </div>
  )
}
