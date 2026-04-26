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

export const TimerDisplay = ({
  hours,
  minutes,
  seconds,
  isFreeMode,
  isRunning,
}: TimerDisplayProps) => {
  const showHours = hours > 0 || isFreeMode

  return (
    <div className="flex flex-col items-center select-none">
      <span className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
        {isRunning ? 'Focusing' : isFreeMode ? 'Free timer' : 'Ready'}
      </span>

      <div className="flex items-end gap-1 tabular-nums">
        {showHours && (
          <>
            <span className="text-6xl font-thin tracking-tighter text-foreground leading-none">
              {pad(hours)}
            </span>
            <span className="mb-2 text-2xl font-thin text-muted-foreground/60 leading-none">h</span>
          </>
        )}
        <span className="text-6xl font-thin tracking-tighter text-foreground leading-none">
          {pad(minutes)}
        </span>
        <span className="mb-2 text-2xl font-thin text-muted-foreground/60 leading-none">m</span>
        <span className="text-6xl font-thin tracking-tighter text-foreground leading-none">
          {pad(seconds)}
        </span>
        <span className="mb-2 text-2xl font-thin text-muted-foreground/60 leading-none">s</span>
      </div>
    </div>
  )
}
