'use server'

import 'server-only'

import { getPayload } from 'payload'
import { after } from 'next/server'
import config from '@/payload.config'
import { ok, err } from '@/types/result'
import { pool } from '@/lib/db-pool'
import { getSession } from '@/lib/get-session'
import {
  getCurrentWorkspaceId,
  getEffectiveWorkspacePermissions,
  getWorkspaceNicknames,
} from '@/lib/get-current-workspace'
import { getTeamPermissions } from '@/api/teams/internal'
import { generateOccurrences } from './calendar-recurrence'
import {
  sendEventCanceledEmail,
  sendEventInvitationEmail,
  sendEventUpdatedEmail,
} from '@/lib/notification-emails'
import type { RecurrenceRule, SeriesAdjustment } from './actions'

// Meeting scheduler for the Workspace Calendar: find a slot where the
// participants are free, create the event linked to the chosen teams, and
// invite everyone (accept / decline).
//
// Availability only ever comes from events of the active workspace — the
// ones a person created or is assigned to — and only their time + "show as"
// status leave the server, never their title or details.

export type ShowAs = 'free' | 'tentative' | 'busy' | 'away'

export interface BusyInterval {
  start: string
  end: string
  showAs: Exclude<ShowAs, 'free'>
}

export interface ParticipantAvailability {
  userId: string
  intervals: BusyInterval[]
}

export interface SchedulingAvailability {
  /** The caller — the meeting's organizer, always first in `people`. */
  organizerId: string
  people: ParticipantAvailability[]
}

const MAX_PARTICIPANTS = 50

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

/** Of `userIds`, the ones that are members of the workspace. */
async function filterWorkspaceMembers(workspaceId: string, userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return []
  const { rows } = await pool.query<{ userId: string }>(
    `SELECT "userId" FROM member WHERE "organizationId" = $1 AND "userId" = ANY($2)`,
    [workspaceId, userIds],
  )
  return rows.map((r) => r.userId)
}

/**
 * When the caller (the organizer) and each of `participantIds` are taken
 * between `from` and `to` (ISO), from their events in the active workspace
 * — the ones they created or are assigned to, recurring series expanded.
 * A meeting only takes a participant's time once they've accepted it (its
 * organizer always). Events shown as "free" don't count. `excludeEventId`
 * leaves out the meeting being rescheduled, so it doesn't block itself.
 * The organizer is identified from the session here, so the client never
 * has to know its own id to build the grid.
 */
export const getSchedulingAvailability = async (
  from: string,
  to: string,
  participantIds: string[],
  excludeEventId?: number,
): Promise<SchedulingAvailability | null> => {
  const userId = await getUserId()
  if (!userId) return null
  const workspaceId = await getCurrentWorkspaceId()
  if (!workspaceId) return null

  const requested = [...new Set(participantIds)]
    .filter((id) => id !== userId)
    .slice(0, MAX_PARTICIPANTS)
  const members = await filterWorkspaceMembers(workspaceId, [...requested, userId])
  if (!members.includes(userId)) return null
  const people = [userId, ...requested.filter((id) => members.includes(id))]

  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate <= fromDate) {
    return null
  }

  const { rows: assignedRows } = await pool.query<{ parent_id: number; text: string }>(
    `SELECT parent_id, text FROM calendar_events_texts WHERE path = 'assignedTo' AND text = ANY($1)`,
    [people],
  )
  const assignedEventIds = [...new Set(assignedRows.map((r) => r.parent_id))]

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'calendar-events',
    limit: 2000,
    pagination: false,
    depth: 0,
    where: {
      and: [
        { workspace: { equals: workspaceId } },
        // Recurring series can start long before `to`; the range check is
        // done per occurrence below.
        { startDate: { less_than_equal: to } },
        {
          or: [
            { userId: { in: people } },
            ...(assignedEventIds.length > 0 ? [{ id: { in: assignedEventIds } }] : []),
          ],
        },
      ],
    },
  })

  const byPerson = new Map<string, BusyInterval[]>(people.map((id) => [id, []]))
  const personSet = new Set(people)

  // Who accepted which meeting: "eventId|userId".
  const meetingIds = docs.filter((d) => d.isMeeting).map((d) => d.id)
  const accepted = new Set<string>()
  if (meetingIds.length > 0) {
    const { rows } = await pool.query<{ event_id: number; user_id: string }>(
      `SELECT event_id, user_id FROM calendar_event_invitations
        WHERE event_id = ANY($1) AND user_id = ANY($2) AND status = 'accepted'`,
      [meetingIds, people],
    )
    for (const r of rows) accepted.add(`${r.event_id}|${r.user_id}`)
  }

  for (const doc of docs) {
    if (excludeEventId !== undefined && (doc.id === excludeEventId || doc.recurrenceId === excludeEventId)) {
      continue
    }
    const showAs = ((doc as { showAs?: ShowAs | null }).showAs ?? 'busy') as ShowAs
    if (showAs === 'free') continue

    const concerned = new Set<string>()
    if (personSet.has(doc.userId)) concerned.add(doc.userId)
    for (const id of (doc.assignedTo ?? []) as string[]) {
      if (!personSet.has(id)) continue
      // A meeting's participant is only taken once they've accepted it.
      if (doc.isMeeting && id !== doc.userId && !accepted.has(`${doc.id}|${id}`)) continue
      concerned.add(id)
    }
    if (concerned.size === 0) continue

    const intervals: { start: Date; end: Date }[] = []
    const recurrence = doc.recurrence as RecurrenceRule | null | undefined
    if (recurrence?.frequency && !doc.recurrenceId) {
      const exceptions = new Set(
        ((doc.exceptions ?? []) as { date: string }[]).map((e) =>
          new Date(e.date).toISOString().slice(0, 10),
        ),
      )
      for (const occ of generateOccurrences(
        {
          startDate: doc.startDate,
          endDate: doc.endDate,
          recurrence,
          adjustments: (doc.adjustments ?? []) as SeriesAdjustment[],
        },
        fromDate,
        toDate,
        exceptions,
      )) {
        intervals.push({ start: occ.date, end: occ.endDate })
      }
    } else {
      intervals.push({ start: new Date(doc.startDate), end: new Date(doc.endDate) })
    }

    for (const { start, end } of intervals) {
      if (end <= fromDate || start >= toDate) continue
      for (const id of concerned) {
        byPerson.get(id)!.push({ start: start.toISOString(), end: end.toISOString(), showAs })
      }
    }
  }

  return {
    organizerId: userId,
    people: people.map((id) => ({ userId: id, intervals: byPerson.get(id)! })),
  }
}

export interface ScheduleMeetingInput {
  title: string
  description?: string
  startDate: string
  endDate: string
  showAs: ShowAs
  teamIds: number[]
  /** Everyone invited (the organizer is added automatically). */
  participantIds: string[]
}

/**
 * Creates the meeting in the active workspace, linked to every chosen team
 * (it shows in each of their calendars), assigned to all participants (so
 * it's in their agenda right away) and sends each of them an invitation.
 */
export const scheduleMeeting = async (input: ScheduleMeetingInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getCurrentWorkspaceId()
    if (!workspaceId) return err('No active workspace')

    const title = input.title.trim()
    if (!title) return err('Title is required')
    const start = new Date(input.startDate)
    const end = new Date(input.endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return err('Invalid time slot')
    }
    if (!['free', 'tentative', 'busy', 'away'].includes(input.showAs)) return err('Invalid status')

    const permissions = await getEffectiveWorkspacePermissions(workspaceId, userId)
    if (!permissions.canManageCalendar) return err('Not authorized')

    const payload = await getPayload({ config })

    const teamIds = [...new Set(input.teamIds)]
    for (const teamId of teamIds) {
      const team = await payload
        .findByID({ collection: 'teams', id: teamId, depth: 0 })
        .catch(() => null)
      if (!team || team.workspace !== workspaceId || team.planArchivedAt) {
        return err('Team not found')
      }
      if (!(await getTeamPermissions(teamId, userId)).canManageCalendar) {
        return err('Not authorized')
      }
    }

    const requested = [...new Set(input.participantIds)].filter((id) => id !== userId)
    if (requested.length === 0) return err('Add at least one participant')
    if (requested.length > MAX_PARTICIPANTS) return err('Too many participants')
    const participants = await filterWorkspaceMembers(workspaceId, requested)
    if (participants.length !== requested.length) {
      return err('Some participants are not members of this workspace')
    }

    const event = await payload.create({
      collection: 'calendar-events',
      data: {
        userId,
        workspace: workspaceId,
        title,
        description: input.description?.trim() || undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        allDay: false,
        showAs: input.showAs,
        isMeeting: true,
        ...(teamIds.length > 0 && { teams: teamIds }),
        // The organizer too, so the meeting is in their own agenda even
        // though it's linked to teams.
        assignedTo: [userId, ...participants],
      },
    })

    for (const participant of participants) {
      await payload.create({
        collection: 'calendar-event-invitations',
        data: { event: event.id, userId: participant, invitedBy: userId, status: 'pending' },
      })
    }

    after(async () => {
      const [nicknames, { rows }] = await Promise.all([
        getWorkspaceNicknames(workspaceId),
        pool.query<{ id: string; name: string; email: string; timezone: string | null }>(
          `SELECT id, name, email, timezone FROM "user" WHERE id = ANY($1)`,
          [[userId, ...participants]],
        ),
      ])
      const organizer = rows.find((r) => r.id === userId)
      const inviterName = nicknames.get(userId) ?? organizer?.name ?? null
      for (const row of rows) {
        if (row.id === userId) continue
        await sendEventInvitationEmail(row.email, {
          title,
          inviterName,
          start,
          end,
          timezone: row.timezone || 'UTC',
        })
      }
    })

    return ok({ id: event.id })
  } catch (e) {
    console.error(e)
    return err('Error scheduling the meeting')
  }
}

async function getUserRows(ids: string[]) {
  const { rows } = await pool.query<{
    id: string
    name: string
    email: string
    timezone: string | null
  }>(`SELECT id, name, email, timezone FROM "user" WHERE id = ANY($1)`, [ids])
  return rows
}

/** Can the caller change (or cancel) this meeting: its organizer, or a manager of a linked team. */
async function canManageMeeting(
  event: { userId: string; teams?: unknown[] | null },
  userId: string,
): Promise<boolean> {
  if (event.userId === userId) return true
  for (const t of event.teams ?? []) {
    const teamId = typeof t === 'object' && t ? (t as { id: number }).id : (t as number)
    if (teamId && (await getTeamPermissions(teamId, userId)).canManageCalendar) return true
  }
  return false
}

export interface MeetingDetails {
  id: number
  title: string
  description: string | null
  startDate: string
  endDate: string
  showAs: ShowAs
  teamIds: number[]
  /** Invited people still on the meeting (declined ones left out). */
  participantIds: string[]
  canEdit: boolean
}

/** A meeting as the scheduler needs it to edit it. */
export const getMeetingDetails = async (eventId: number): Promise<MeetingDetails | null> => {
  const userId = await getUserId()
  if (!userId) return null
  const workspaceId = await getCurrentWorkspaceId()
  if (!workspaceId) return null
  const payload = await getPayload({ config })
  const event = await payload
    .findByID({ collection: 'calendar-events', id: eventId, depth: 0 })
    .catch(() => null)
  if (!event || !event.isMeeting || event.workspace !== workspaceId) return null
  const { docs } = await payload.find({
    collection: 'calendar-event-invitations',
    where: { and: [{ event: { equals: eventId } }, { status: { not_equals: 'declined' } }] },
    limit: MAX_PARTICIPANTS + 1,
    depth: 0,
  })
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    startDate: event.startDate,
    endDate: event.endDate,
    showAs: ((event.showAs as ShowAs | null) ?? 'busy') as ShowAs,
    teamIds: ((event.teams ?? []) as unknown[])
      .map((t) => (typeof t === 'object' && t ? (t as { id: number }).id : (t as number)))
      .filter((id): id is number => typeof id === 'number'),
    participantIds: docs.map((d) => d.userId),
    canEdit: await canManageMeeting(event as { userId: string; teams?: unknown[] }, userId),
  }
}

/**
 * Changes a meeting — the same checks as scheduling it. New participants get
 * an invitation, removed ones lose theirs (and get a cancellation email),
 * and everyone kept is notified of the change. When the time changes, their
 * answers are reset: they're asked to accept or decline again.
 */
export const updateMeeting = async (eventId: number, input: ScheduleMeetingInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getCurrentWorkspaceId()
    if (!workspaceId) return err('No active workspace')

    const payload = await getPayload({ config })
    const event = await payload
      .findByID({ collection: 'calendar-events', id: eventId, depth: 0 })
      .catch(() => null)
    if (!event || !event.isMeeting || event.workspace !== workspaceId) {
      return err('Meeting not found')
    }
    if (!(await canManageMeeting(event as { userId: string; teams?: unknown[] }, userId))) {
      return err('Not authorized')
    }
    const organizerId = event.userId

    const title = input.title.trim()
    if (!title) return err('Title is required')
    const start = new Date(input.startDate)
    const end = new Date(input.endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return err('Invalid time slot')
    }
    if (!['free', 'tentative', 'busy', 'away'].includes(input.showAs)) return err('Invalid status')

    const teamIds = [...new Set(input.teamIds)]
    const previousTeamIds = new Set(
      ((event.teams ?? []) as unknown[]).map((t) =>
        typeof t === 'object' && t ? (t as { id: number }).id : (t as number),
      ),
    )
    for (const teamId of teamIds) {
      const team = await payload
        .findByID({ collection: 'teams', id: teamId, depth: 0 })
        .catch(() => null)
      if (!team || team.workspace !== workspaceId || team.planArchivedAt) {
        return err('Team not found')
      }
      // Linking a new team needs the right to manage its calendar.
      if (!previousTeamIds.has(teamId) && !(await getTeamPermissions(teamId, userId)).canManageCalendar) {
        return err('Not authorized')
      }
    }

    const requested = [...new Set(input.participantIds)].filter((id) => id !== organizerId)
    if (requested.length === 0) return err('Add at least one participant')
    if (requested.length > MAX_PARTICIPANTS) return err('Too many participants')
    const participants = await filterWorkspaceMembers(workspaceId, requested)
    if (participants.length !== requested.length) {
      return err('Some participants are not members of this workspace')
    }

    const timeChanged =
      new Date(event.startDate).getTime() !== start.getTime() ||
      new Date(event.endDate).getTime() !== end.getTime()
    const changes: string[] = []
    if (timeChanged) changes.push('new time')
    if (title !== event.title) changes.push('new title')
    if ((input.description?.trim() || null) !== (event.description || null)) changes.push('new details')

    const { docs: invitations } = await payload.find({
      collection: 'calendar-event-invitations',
      where: { event: { equals: eventId } },
      limit: 0,
      depth: 0,
    })
    const byUser = new Map(invitations.map((i) => [i.userId, i]))
    const participantSet = new Set(participants)
    const added = participants.filter((id) => !byUser.has(id) || byUser.get(id)!.status === 'declined')
    const removed = invitations.filter((i) => !participantSet.has(i.userId) && i.status !== 'declined')
    if (added.length > 0 || removed.length > 0) changes.push('participants updated')
    const summary = changes.length > 0 ? changes.join(', ') : 'details updated'

    await payload.update({
      collection: 'calendar-events',
      id: eventId,
      data: {
        title,
        description: input.description?.trim() || null,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        showAs: input.showAs,
        teams: teamIds,
        assignedTo: [organizerId, ...participants],
      },
    })

    const now = new Date().toISOString()
    for (const id of participants) {
      const existing = byUser.get(id)
      if (!existing) {
        await payload.create({
          collection: 'calendar-event-invitations',
          data: { event: eventId, userId: id, invitedBy: userId, status: 'pending' },
        })
      } else {
        const reinvited = existing.status === 'declined'
        await payload.update({
          collection: 'calendar-event-invitations',
          id: existing.id,
          data: {
            ...((timeChanged || reinvited) && { status: 'pending', respondedAt: null }),
            ...(!reinvited && { changedAt: now, changeSummary: summary }),
          },
        })
      }
    }
    for (const inv of removed) {
      await payload.delete({ collection: 'calendar-event-invitations', id: inv.id })
    }

    const notifyUpdated = participants.filter((id) => byUser.has(id) && !added.includes(id))
    after(async () => {
      const [nicknames, rows] = await Promise.all([
        getWorkspaceNicknames(workspaceId),
        getUserRows([userId, ...participants, ...removed.map((r) => r.userId)]),
      ])
      const actor = rows.find((r) => r.id === userId)
      const actorName = nicknames.get(userId) ?? actor?.name ?? null
      for (const row of rows) {
        if (row.id === userId) continue
        const timezone = row.timezone || 'UTC'
        if (added.includes(row.id)) {
          await sendEventInvitationEmail(row.email, { title, inviterName: actorName, start, end, timezone })
        } else if (notifyUpdated.includes(row.id)) {
          await sendEventUpdatedEmail(row.email, {
            title,
            organizerName: actorName,
            start,
            end,
            timezone,
            summary,
            needsResponse: timeChanged,
          })
        } else if (removed.some((r) => r.userId === row.id)) {
          await sendEventCanceledEmail(row.email, {
            title,
            organizerName: actorName,
            start: new Date(event.startDate),
            end: new Date(event.endDate),
            timezone,
          })
        }
      }
    })

    return ok({ id: eventId })
  } catch (e) {
    console.error(e)
    return err('Error updating the meeting')
  }
}

export interface EventUpdateNotice {
  /** Invitation id. */
  id: number
  eventId: number
  title: string
  startDate: string
  endDate: string
  changedAt: string
  summary: string
  organizerName: string
  organizerImage: string | null
}

/** Meetings the viewer is on that their organizer changed (for the bell). */
export const listMyEventUpdates = async (): Promise<EventUpdateNotice[]> => {
  const userId = await getUserId()
  if (!userId) return []
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'calendar-event-invitations',
    where: {
      and: [
        { userId: { equals: userId } },
        { changedAt: { exists: true } },
        { status: { not_equals: 'declined' } },
      ],
    },
    sort: '-changedAt',
    limit: 30,
    depth: 1,
  })
  const withEvent = docs.filter((d) => d.event && typeof d.event === 'object' && d.changedAt)
  if (withEvent.length === 0) return []
  const organizers = new Map(
    (
      await pool.query<{ id: string; name: string; image: string | null }>(
        `SELECT id, name, image FROM "user" WHERE id = ANY($1)`,
        [[...new Set(withEvent.map((d) => (d.event as { userId: string }).userId))]],
      )
    ).rows.map((r) => [r.id, r]),
  )
  return withEvent.map((d) => {
    const event = d.event as {
      id: number
      title: string
      startDate: string
      endDate: string
      userId: string
    }
    const organizer = organizers.get(event.userId)
    return {
      id: d.id,
      eventId: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      changedAt: d.changedAt as string,
      summary: d.changeSummary ?? 'details updated',
      organizerName: organizer?.name ?? 'Someone',
      organizerImage: organizer?.image ?? null,
    }
  })
}

export interface EventInvitation {
  id: number
  eventId: number
  title: string
  startDate: string
  endDate: string
  inviterName: string
  inviterImage: string | null
  createdAt: string
}

/** The viewer's pending meeting invitations (for the notification bell). */
export const listMyEventInvitations = async (): Promise<EventInvitation[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'calendar-event-invitations',
    where: { and: [{ userId: { equals: userId } }, { status: { equals: 'pending' } }] },
    sort: '-createdAt',
    limit: 50,
    depth: 1,
  })
  const withEvent = docs.filter((d) => d.event && typeof d.event === 'object')
  if (withEvent.length === 0) return []

  const inviterIds = [...new Set(withEvent.map((d) => d.invitedBy))]
  const { rows } = await pool.query<{ id: string; name: string; image: string | null }>(
    `SELECT id, name, image FROM "user" WHERE id = ANY($1)`,
    [inviterIds],
  )
  const inviters = new Map(rows.map((r) => [r.id, r]))

  return withEvent.map((d) => {
    const event = d.event as { id: number; title: string; startDate: string; endDate: string }
    const inviter = inviters.get(d.invitedBy)
    return {
      id: d.id,
      eventId: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      inviterName: inviter?.name ?? 'Someone',
      inviterImage: inviter?.image ?? null,
      createdAt: d.createdAt,
    }
  })
}

/**
 * Accepts or declines one of the viewer's own invitations. Declining also
 * takes the meeting out of their agenda (off the event's assignees).
 */
export const respondToEventInvitation = async (
  invitationId: number,
  response: 'accepted' | 'declined',
) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    if (response !== 'accepted' && response !== 'declined') return err('Invalid response')

    const payload = await getPayload({ config })
    const invitation = await payload
      .findByID({ collection: 'calendar-event-invitations', id: invitationId, depth: 0 })
      .catch(() => null)
    if (!invitation || invitation.userId !== userId) return err('Invitation not found')

    await payload.update({
      collection: 'calendar-event-invitations',
      id: invitationId,
      data: { status: response, respondedAt: new Date().toISOString() },
    })

    const eventId =
      typeof invitation.event === 'object' ? invitation.event.id : (invitation.event as number)
    const event = await payload
      .findByID({ collection: 'calendar-events', id: eventId, depth: 0 })
      .catch(() => null)
    if (event) {
      const assigned = (event.assignedTo ?? []) as string[]
      const next =
        response === 'declined'
          ? assigned.filter((id) => id !== userId)
          : assigned.includes(userId)
            ? assigned
            : [...assigned, userId]
      if (next.length !== assigned.length) {
        await payload.update({
          collection: 'calendar-events',
          id: eventId,
          data: { assignedTo: next },
        })
      }
    }

    return ok(true)
  } catch (e) {
    console.error(e)
    return err('Error responding to the invitation')
  }
}

export interface EventAttendee {
  userId: string
  status: 'organizer' | 'pending' | 'accepted' | 'declined'
}

/** Who was invited to an event and what they answered — for anyone who can see it. */
export const listEventAttendees = async (eventId: number): Promise<EventAttendee[]> => {
  const userId = await getUserId()
  if (!userId) return []
  const workspaceId = await getCurrentWorkspaceId()
  if (!workspaceId) return []

  const payload = await getPayload({ config })
  const event = await payload
    .findByID({ collection: 'calendar-events', id: eventId, depth: 0 })
    .catch(() => null)
  if (!event || event.workspace !== workspaceId) return []

  // Someone who declined is off the event (and off its assignees) — they're
  // no longer listed.
  const { docs } = await payload.find({
    collection: 'calendar-event-invitations',
    where: { and: [{ event: { equals: eventId } }, { status: { not_equals: 'declined' } }] },
    limit: MAX_PARTICIPANTS + 1,
    depth: 0,
  })
  if (docs.length === 0) return []

  // Same people who can see the event: its organizer, its assignees and
  // invitees, or — for a team event, since team calendars are open to the
  // whole workspace — any member.
  const isTeamEvent = !!event.team || ((event.teams ?? []) as unknown[]).length > 0
  const canSee =
    isTeamEvent ||
    event.userId === userId ||
    ((event.assignedTo ?? []) as string[]).includes(userId) ||
    docs.some((d) => d.userId === userId)
  if (!canSee) return []

  return [
    { userId: event.userId, status: 'organizer' as const },
    ...docs.map((d) => ({ userId: d.userId, status: d.status })),
  ]
}
