'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Check, ChevronLeft, Loader2, Sparkles, UsersRound } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { api } from '@/api'
import { useSession } from '@/lib/auth-client'
import { useTeams } from '@/hooks/teams/use-teams'
import { useTimeFormat } from '@/hooks/calendar/use-time-format'
import {
  getSchedulingAvailability,
  scheduleMeeting,
  type ParticipantAvailability,
} from '@/api/calendar/scheduler-actions'
import { SHOW_AS_OPTIONS, showAsOption, type ShowAs } from './show-as'

// Meeting scheduler: day → duration → teams & members → suggested slot and
// availability grid over the chosen time window (8:00–18:00 by default, up
// to the whole day) → details, then the meeting is created
// linked to the chosen teams and every participant gets an invitation.

const DURATIONS = [15, 30, 45, 60, 90, 120]
// Time window the slots are proposed in, in minutes from midnight (0–1440).
const DEFAULT_WINDOW_START = 8 * 60
const DEFAULT_WINDOW_END = 18 * 60
const WINDOW_STEP = 30
const WINDOW_OPTIONS = Array.from({ length: 1440 / WINDOW_STEP + 1 }, (_, i) => i * WINDOW_STEP)

/** `day` at `minutes` past its midnight (1440 = the next midnight). */
function atMinutes(day: Date, minutes: number): Date {
  const d = new Date(day)
  d.setHours(0, minutes, 0, 0)
  return d
}
const STATUS_RANK: Record<ShowAs, number> = { free: 0, tentative: 1, busy: 2, away: 3 }

/** Slots start every `duration` minutes (between 15 min and 1 h). */
function slotStep(duration: number) {
  return Math.min(60, Math.max(15, duration))
}

function buildSlots(
  day: Date,
  duration: number,
  windowStart: number,
  windowEnd: number,
): { start: Date; end: Date }[] {
  const slots: { start: Date; end: Date }[] = []
  const step = slotStep(duration)
  const dayEnd = atMinutes(day, windowEnd)
  const cursor = atMinutes(day, windowStart)
  while (cursor.getTime() + duration * 60_000 <= dayEnd.getTime()) {
    const start = new Date(cursor)
    slots.push({ start, end: new Date(start.getTime() + duration * 60_000) })
    cursor.setTime(cursor.getTime() + step * 60_000)
  }
  return slots
}

/** A person's status over a slot: the "heaviest" overlapping event, or free. */
function statusFor(
  availability: ParticipantAvailability | undefined,
  slot: { start: Date; end: Date },
): ShowAs {
  let status: ShowAs = 'free'
  for (const i of availability?.intervals ?? []) {
    if (new Date(i.start) < slot.end && new Date(i.end) > slot.start) {
      if (STATUS_RANK[i.showAs] > STATUS_RANK[status]) status = i.showAs
    }
  }
  return status
}

interface MeetingSchedulerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate: Date
  /** Called with the meeting's day once it's created (e.g. to show that day). */
  onScheduled?: (day: Date) => void
}

type Step = 1 | 2 | 3 | 4

export function MeetingSchedulerDialog({
  open,
  onOpenChange,
  defaultDate,
  onScheduled,
}: MeetingSchedulerDialogProps) {
  const queryClient = useQueryClient()
  const { formatTime } = useTimeFormat()
  const { data: session } = useSession()
  const myId = session?.user?.id ?? null

  const [step, setStep] = useState<Step>(1)
  const [day, setDay] = useState<Date>(defaultDate)
  const [duration, setDuration] = useState(60)
  const [windowStart, setWindowStart] = useState(DEFAULT_WINDOW_START)
  const [windowEnd, setWindowEnd] = useState(DEFAULT_WINDOW_END)
  const [teamIds, setTeamIds] = useState<number[]>([])
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [slotStart, setSlotStart] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showAs, setShowAs] = useState<ShowAs>('busy')

  useEffect(() => {
    if (!open) return
    setStep(1)
    setDay(defaultDate)
    setDuration(60)
    setWindowStart(DEFAULT_WINDOW_START)
    setWindowEnd(DEFAULT_WINDOW_END)
    setTeamIds([])
    setMemberIds([])
    setSlotStart(null)
    setTitle('')
    setDescription('')
    setShowAs('busy')
    // Only when the dialog opens: the parent passes a fresh Date on every
    // render, which would otherwise reset the questionnaire continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { teams } = useTeams(open)
  const { data: membersData } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: () => api.workspaces.listMembers(),
    enabled: open,
  })
  const members = useMemo(() => membersData?.docs ?? [], [membersData])
  const nameOf = (userId: string) => {
    const m = members.find((x) => x.userId === userId)
    return m ? m.nickname || m.name : 'Member'
  }

  const teamMemberQueries = useQueries({
    queries: teamIds.map((id) => ({
      queryKey: ['teams', id, 'member-ids'],
      queryFn: () => api.teams.listMemberIds(id),
      enabled: open,
    })),
  })

  // Everyone invited: the chosen teams' members plus individually chosen
  // members — never the organizer, who is always in the grid as "You".
  const participantIds = useMemo(() => {
    const ids = new Set<string>(memberIds)
    for (const q of teamMemberQueries) for (const id of q.data ?? []) ids.add(id)
    if (myId) ids.delete(myId)
    return [...ids].filter((id) => members.some((m) => m.userId === id)).sort()
  }, [memberIds, teamMemberQueries, myId, members])

  const slots = useMemo(
    () => buildSlots(day, duration, windowStart, windowEnd),
    [day, duration, windowStart, windowEnd],
  )

  const rangeStart = atMinutes(day, windowStart)
  const rangeEnd = atMinutes(day, windowEnd)

  // The server identifies the organizer from the session and returns them
  // first — the grid never depends on the client knowing its own id.
  const {
    data: availability,
    isPending: availabilityPending,
    isError: availabilityError,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: [
      'scheduler-availability',
      rangeStart.toISOString(),
      rangeEnd.toISOString(),
      participantIds,
    ],
    queryFn: () =>
      getSchedulingAvailability(rangeStart.toISOString(), rangeEnd.toISOString(), participantIds),
    enabled: open && step >= 3 && participantIds.length > 0,
    staleTime: 30_000,
  })
  const organizerId = availability?.organizerId ?? myId
  const people = useMemo(() => availability?.people.map((p) => p.userId) ?? [], [availability])
  const availabilityOf = (userId: string) => availability?.people.find((a) => a.userId === userId)

  const now = Date.now()
  const rows = useMemo(
    () =>
      slots.map((slot) => {
        const statuses = people.map((id) => statusFor(availabilityOf(id), slot))
        const myStatus = statuses[0] ?? 'free'
        const othersFree = statuses.slice(1).filter((st) => st === 'free').length
        // Only slots where the organizer is free and at least one other
        // participant is, and not already in the past.
        const selectable = myStatus === 'free' && othersFree > 0 && slot.start.getTime() > now
        const heavy = statuses.slice(1).filter((st) => st === 'busy' || st === 'away').length
        return { slot, statuses, selectable, othersFree, heavy }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, people, availability],
  )

  const suggested = useMemo(() => {
    const candidates = rows.filter((r) => r.selectable)
    if (candidates.length === 0) return null
    return [...candidates].sort(
      (a, b) =>
        b.othersFree - a.othersFree ||
        a.heavy - b.heavy ||
        a.slot.start.getTime() - b.slot.start.getTime(),
    )[0]
  }, [rows])

  // Preselect the suggestion when the grid loads (or the selection vanished).
  useEffect(() => {
    if (step !== 3) return
    const stillValid = rows.some((r) => r.selectable && r.slot.start.toISOString() === slotStart)
    if (!stillValid) setSlotStart(suggested ? suggested.slot.start.toISOString() : null)
  }, [step, rows, suggested, slotStart])

  const chosen = rows.find((r) => r.slot.start.toISOString() === slotStart) ?? null

  // Why nothing can be picked, when that's the case.
  const noSlotReason = (() => {
    if (suggested) return null
    if (rows.length === 0) return 'This duration doesn\u2019t fit in the chosen time window.'
    if (rows.every((r) => r.slot.start.getTime() <= now)) return 'This day is already over.'
    const upcoming = rows.filter((r) => r.slot.start.getTime() > now)
    if (upcoming.every((r) => r.statuses[0] !== 'free')) {
      return 'You\u2019re not available at any remaining time that day.'
    }
    return 'No participant is available when you are that day.'
  })()

  const scheduleMutation = useMutation({
    mutationFn: () =>
      scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: chosen!.slot.start.toISOString(),
        endDate: chosen!.slot.end.toISOString(),
        showAs,
        teamIds,
        participantIds,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.info('Meeting scheduled', { description: 'Invitations have been sent.' })
      queryClient.invalidateQueries({ queryKey: ['workspace-calendar-events'] })
      onOpenChange(false)
      onScheduled?.(day)
    },
    onError: () => toast.error('Error scheduling the meeting'),
  })

  const windowLabel = (minutes: number) =>
    minutes === 1440 ? '24:00' : formatTime(atMinutes(day, minutes))
  const isWholeDay = windowStart === 0 && windowEnd === 1440

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const windowFits = windowEnd - windowStart >= duration
  const canContinue =
    step === 1
      ? windowFits
      : step === 2
        ? participantIds.length > 0
        : step === 3
          ? !!chosen
          : title.trim().length > 0

  const stepTitles: Record<Step, string> = {
    1: 'When?',
    2: 'Who?',
    3: 'Pick a slot',
    4: 'Details',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule a meeting</DialogTitle>
          <DialogDescription>
            Step {step} of 4 · {stepTitles[step]}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm">Day</Label>
              <div className="flex justify-center rounded-xl border border-border/50">
                <Calendar
                  mode="single"
                  selected={day}
                  onSelect={(d) => d && setDay(d)}
                  disabled={(d) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return d < today
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Duration</Label>
              <div className="flex flex-wrap gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                      duration === d
                        ? 'border-violet-500/50 bg-violet-500/15 text-violet-600 dark:text-violet-400'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {d < 60 ? `${d} min` : `${d / 60} h`.replace('.5 h', ' h 30')}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Time window</Label>
              <p className="text-xs text-muted-foreground/70">
                Slots are only proposed within this range.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="From"
                  value={windowStart}
                  onChange={(e) => setWindowStart(Number(e.target.value))}
                  className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
                >
                  {WINDOW_OPTIONS.filter((m) => m < 1440).map((m) => (
                    <option key={m} value={m}>
                      {windowLabel(m)}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">to</span>
                <select
                  aria-label="To"
                  value={windowEnd}
                  onChange={(e) => setWindowEnd(Number(e.target.value))}
                  className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
                >
                  {WINDOW_OPTIONS.filter((m) => m > 0).map((m) => (
                    <option key={m} value={m}>
                      {windowLabel(m)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setWindowStart(0)
                    setWindowEnd(1440)
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    isWholeDay
                      ? 'border-violet-500/50 bg-violet-500/15 text-violet-600 dark:text-violet-400'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  Whole day
                </button>
                {!(windowStart === DEFAULT_WINDOW_START && windowEnd === DEFAULT_WINDOW_END) && (
                  <button
                    type="button"
                    onClick={() => {
                      setWindowStart(DEFAULT_WINDOW_START)
                      setWindowEnd(DEFAULT_WINDOW_END)
                    }}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Reset to working hours
                  </button>
                )}
              </div>
              {!windowFits && (
                <p className="text-xs text-destructive">
                  The time window must be at least as long as the meeting.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {teams.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1.5">
                  <UsersRound className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Teams
                </Label>
                <p className="text-xs text-muted-foreground/70">
                  Invites every member and adds the meeting to each team&apos;s calendar.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTeamIds((prev) => toggle(prev, t.id))}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                        teamIds.includes(t.id)
                          ? 'border-violet-500/50 bg-violet-500/15 text-violet-600 dark:text-violet-400'
                          : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm">Members</Label>
              <div className="flex flex-wrap gap-1.5">
                {members
                  .filter((m) => m.userId !== myId)
                  .map((m) => {
                    const label = m.nickname || m.name
                    const viaTeam =
                      participantIds.includes(m.userId) && !memberIds.includes(m.userId)
                    const selected = memberIds.includes(m.userId) || viaTeam
                    return (
                      <button
                        key={m.userId}
                        type="button"
                        disabled={viaTeam}
                        title={viaTeam ? 'Invited through a selected team' : undefined}
                        onClick={() => setMemberIds((prev) => toggle(prev, m.userId))}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs font-medium transition-all',
                          selected
                            ? 'border-violet-500/50 bg-violet-500/15 text-violet-600 dark:text-violet-400'
                            : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                          viaTeam && 'opacity-70 cursor-default',
                        )}
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={m.image ?? undefined} alt={label} />
                          <AvatarFallback className="text-[9px]">
                            {label.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {label}
                      </button>
                    )
                  })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {participantIds.length === 0
                ? 'Pick at least one team or member.'
                : `${participantIds.length} participant${participantIds.length > 1 ? 's' : ''} + you`}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {availabilityError || availability === null ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
                Couldn&apos;t load everyone&apos;s availability.
                <Button type="button" variant="outline" size="sm" onClick={() => refetchAvailability()}>
                  Retry
                </Button>
              </div>
            ) : availabilityPending ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking everyone&apos;s availability…
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    Suggested slot
                  </p>
                  {suggested ? (
                    <p className="mt-1 text-sm text-foreground">
                      {format(day, 'EEEE, MMM d')} · {formatTime(suggested.slot.start)} –{' '}
                      {formatTime(suggested.slot.end)}{' '}
                      <span className="text-muted-foreground">
                        ({suggested.othersFree}/{participantIds.length} available)
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {noSlotReason} Try another day or a shorter duration.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  {SHOW_AS_OPTIONS.map((o) => (
                    <span key={o.value} className="flex items-center gap-1">
                      <span className={cn('h-2 w-2 rounded-full', o.dot)} />
                      {o.label}
                    </span>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="sticky left-0 z-10 bg-muted/40 px-2 py-2 text-left font-medium">
                          Time
                        </th>
                        {people.map((id) => (
                          <th key={id} className="max-w-[90px] px-2 py-2 text-left font-medium">
                            <span className="block truncate">
                              {id === organizerId ? 'You' : nameOf(id)}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const key = r.slot.start.toISOString()
                        const isChosen = key === slotStart
                        return (
                          <tr
                            key={key}
                            onClick={() => r.selectable && setSlotStart(key)}
                            className={cn(
                              'border-t border-border/40',
                              r.selectable ? 'cursor-pointer hover:bg-muted/40' : 'opacity-40',
                              isChosen && 'bg-violet-500/10 hover:bg-violet-500/10',
                            )}
                          >
                            <td className="sticky left-0 z-10 bg-background px-2 py-1.5 font-medium whitespace-nowrap">
                              <span className="flex items-center gap-1">
                                {isChosen && <Check className="h-3 w-3 text-violet-600" />}
                                {formatTime(r.slot.start)}
                              </span>
                            </td>
                            {r.statuses.map((st, i) => (
                              <td key={people[i]} className="px-1 py-1">
                                <span
                                  className={cn(
                                    'block rounded-md px-1.5 py-1 text-center text-[10px] font-medium',
                                    showAsOption(st).cell,
                                  )}
                                >
                                  {showAsOption(st).label}
                                </span>
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only slots where you and at least one participant are available can be picked.
                </p>
              </>
            )}
          </div>
        )}

        {step === 4 && chosen && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {format(day, 'EEEE, MMM d')} · {formatTime(chosen.slot.start)} –{' '}
              {formatTime(chosen.slot.end)} · {participantIds.length + 1} people
            </p>
            <div className="space-y-2">
              <Label htmlFor="meeting-title" className="text-sm">
                Title
              </Label>
              <Input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly sync"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-description" className="text-sm">
                Description{' '}
                <span className="text-xs font-normal text-muted-foreground">Optional</span>
              </Label>
              <Textarea
                id="meeting-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Show as</Label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {SHOW_AS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setShowAs(o.value)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all',
                      showAs === o.value
                        ? 'border-violet-500/50 bg-violet-500/15 text-foreground'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full', o.dot)} />
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep((s) => (s - 1) as Step))}
          >
            {step === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                Back
              </>
            )}
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep((s) => (s + 1) as Step)}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!canContinue || scheduleMutation.isPending}
              onClick={() => scheduleMutation.mutate()}
            >
              {scheduleMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send invitations
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
