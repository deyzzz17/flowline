import { FlowlineLogo } from '@/components/header/flowline-logo'

const WAVE_LINE_COUNT = 16
const WAVE_PATH =
  'M -40 400 C 120 360, 220 430, 340 410 C 460 390, 500 300, 580 250 C 660 200, 690 110, 770 90 C 840 74, 870 120, 940 150'

// Code-drawn recreation of the auth-cover artwork (flowing violet lines +
// wordmark) instead of a raster export, so it's pixel-sharp at any screen
// size/density and adapts to light/dark via the same tokens as the rest of
// the app — no separate image assets to keep in sync.
export const AuthCover = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-background">
      <svg
        viewBox="0 0 900 500"
        preserveAspectRatio="xMidYMax slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="auth-cover-line"
            x1="0"
            y1="0"
            x2="900"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.1" />
            <stop offset="55%" stopColor="#8b5cf6" stopOpacity="0.55" />
            <stop offset="82%" stopColor="#a78bfa" stopOpacity="1" />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.45" />
          </linearGradient>
          <filter id="auth-cover-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {Array.from({ length: WAVE_LINE_COUNT }).map((_, i) => {
          const offset = i - (WAVE_LINE_COUNT - 1) / 2
          const distance = Math.abs(offset)
          const isCore = distance < 1
          return (
            <path
              key={i}
              d={WAVE_PATH}
              transform={`translate(0, ${offset * 5.5})`}
              fill="none"
              stroke="url(#auth-cover-line)"
              strokeWidth={isCore ? 2 : 1}
              strokeLinecap="round"
              opacity={Math.max(0.04, 0.55 - distance * 0.065)}
              filter={isCore ? 'url(#auth-cover-glow)' : undefined}
            />
          )
        })}
      </svg>

      <span className="absolute top-[18%] left-[15%] h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_12px_4px_rgba(139,92,246,0.55)]" />
      <span className="absolute top-[25%] left-[13.5%] h-1 w-1 rounded-full bg-violet-400/70" />
      <span className="absolute bottom-[22%] left-[22%] h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_14px_5px_rgba(139,92,246,0.5)]" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        <div className="flex items-center gap-2.5">
          <FlowlineLogo />
          <span className="text-xl font-semibold text-foreground">Flowline</span>
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Plan. Focus.{' '}
            <span className="bg-linear-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
              Flow.
            </span>
          </h2>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
            All your tasks, habits and events, connected in one calm workspace.
          </p>
        </div>
      </div>
    </div>
  )
}
