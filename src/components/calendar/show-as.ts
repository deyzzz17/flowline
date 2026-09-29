export type ShowAs = 'free' | 'tentative' | 'busy' | 'away'

/**
 * The four availability statuses of a Workspace Calendar event ("show as"),
 * as used by the meeting scheduler. `dot`/`cell` are Tailwind classes for
 * the legend dots and the availability grid cells.
 */
export const SHOW_AS_OPTIONS: { value: ShowAs; label: string; dot: string; cell: string }[] = [
  {
    value: 'free',
    label: 'Available',
    dot: 'bg-emerald-500',
    cell: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  {
    value: 'tentative',
    label: 'Tentative',
    dot: 'bg-amber-500',
    cell: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  {
    value: 'busy',
    label: 'Busy',
    dot: 'bg-red-500',
    cell: 'bg-red-500/15 text-red-700 dark:text-red-400',
  },
  {
    value: 'away',
    label: 'Away',
    dot: 'bg-slate-500',
    cell: 'bg-slate-500/20 text-slate-700 dark:text-slate-300',
  },
]

export const showAsOption = (value: ShowAs | undefined | null) =>
  SHOW_AS_OPTIONS.find((o) => o.value === (value ?? 'busy')) ?? SHOW_AS_OPTIONS[2]
