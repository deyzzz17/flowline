import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Pool } from 'pg'

export const syncGoogleCalendar = inngest.createFunction(
  { id: 'sync-google-calendar', name: 'Sync Google Calendar', triggers: { cron: '*/15 * * * *' } },
  async ({ step }) => {
    const payload = await getPayload({ config })
    const { docs: syncs } = await payload.find({
      collection: 'google-calendar-syncs',
      where: { status: { equals: 'connected' } },
      limit: 100,
    })
    for (const sync of syncs) {
      await step.run(`sync-user-${sync.id}`, async () => {
        await syncUserGoogleCalendar(sync as any, payload)
      })
    }
    return { synced: syncs.length }
  },
)

export const syncGoogleCalendarForUser = inngest.createFunction(
  {
    id: 'sync-google-calendar-for-user',
    name: 'Sync Google Calendar for User',
    triggers: { event: 'calendar/google.sync.requested' },
  },
  async ({ event, step }) => {
    const { userId } = event.data
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'google-calendar-syncs',
      where: { userId: { equals: userId } },
      limit: 1,
    })
    if (docs.length === 0) return { error: 'No sync record found' }
    await step.run('sync', async () => {
      await syncUserGoogleCalendar(docs[0] as any, payload)
    })
    return { synced: true }
  },
)

async function syncUserGoogleCalendar(sync: any, payload: any) {
  const { userId, calendars = [], nextSyncToken } = sync

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  let account: any
  try {
    const result = await pool.query(
      `SELECT id, "accessToken", "refreshToken", "accessTokenExpiresAt"
       FROM account
       WHERE "userId" = $1 AND "providerId" = 'google'
       LIMIT 1`,
      [userId],
    )
    if (result.rows.length === 0) {
      await payload.update({
        collection: 'google-calendar-syncs',
        id: sync.id,
        data: { status: 'error', errorMessage: 'No Google account found' } as any,
      })
      return
    }
    account = result.rows[0]
  } finally {
    await pool.end()
  }

  let accessToken = account.accessToken

  if (account.accessTokenExpiresAt && new Date(account.accessTokenExpiresAt) < new Date()) {
    const refreshed = await refreshGoogleToken(account.refreshToken)
    if (!refreshed) {
      await payload.update({
        collection: 'google-calendar-syncs',
        id: sync.id,
        data: { status: 'error', errorMessage: 'Failed to refresh token' } as any,
      })
      return
    }
    accessToken = refreshed.accessToken
    const pool2 = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
      await pool2.query(
        `UPDATE account SET "accessToken" = $1, "accessTokenExpiresAt" = $2 WHERE id = $3`,
        [refreshed.accessToken, refreshed.expiresAt, account.id],
      )
    } finally {
      await pool2.end()
    }
  }

  const enabledCalendars = calendars.filter((c: any) => c.enabled)
  let newNextSyncToken = nextSyncToken

  for (const cal of enabledCalendars) {
    try {
      const url = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.googleId)}/events`,
      )
      url.searchParams.set('singleEvents', 'true')
      url.searchParams.set('maxResults', '500')

      if (nextSyncToken) {
        url.searchParams.set('syncToken', nextSyncToken)
      } else {
        const timeMin = new Date()
        timeMin.setMonth(timeMin.getMonth() - 3)
        const timeMax = new Date()
        timeMax.setFullYear(timeMax.getFullYear() + 1)
        url.searchParams.set('timeMin', timeMin.toISOString())
        url.searchParams.set('timeMax', timeMax.toISOString())
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!res.ok) {
        if (res.status === 410) {
          newNextSyncToken = undefined
          continue
        }
        console.error(`Failed to fetch calendar ${cal.googleId}:`, res.status)
        continue
      }

      const data = await res.json()
      newNextSyncToken = data.nextSyncToken ?? newNextSyncToken

      const items: any[] = data.items ?? []
      if (items.length === 0) continue

      const googleIds = items.map((e: any) => e.id)
      const { docs: existing } = await payload.find({
        collection: 'calendar-events',
        where: { googleEventId: { in: googleIds } },
        limit: 500,
      })

      const existingMap = new Map<string, number>(
        existing.map((e: any) => [e.googleEventId as string, e.id as number]),
      )

      await Promise.all(
        items.map((gEvent: any) => upsertGoogleEvent(gEvent, cal, userId, payload, existingMap)),
      )
    } catch (e) {
      console.error(`Error syncing calendar ${cal.googleId}:`, e)
    }
  }

  await payload.update({
    collection: 'google-calendar-syncs',
    id: sync.id,
    data: {
      lastSyncedAt: new Date().toISOString(),
      nextSyncToken: newNextSyncToken,
      status: 'connected',
      errorMessage: undefined,
    } as any,
  })
}

async function upsertGoogleEvent(
  gEvent: any,
  cal: any,
  userId: string,
  payload: any,
  existingMap: Map<string, number>,
) {
  if (gEvent.status === 'cancelled') {
    const existingId = existingMap.get(gEvent.id)
    if (existingId) {
      await payload.delete({ collection: 'calendar-events', id: existingId })
    }
    return
  }

  if (!gEvent.start) return

  const allDay = !gEvent.start.dateTime
  const startDate = gEvent.start.dateTime
    ? new Date(gEvent.start.dateTime).toISOString()
    : new Date(gEvent.start.date + 'T00:00:00').toISOString()
  const endDate = gEvent.end?.dateTime
    ? new Date(gEvent.end.dateTime).toISOString()
    : gEvent.end?.date
      ? new Date(gEvent.end.date + 'T00:00:00').toISOString()
      : startDate

  const eventData = {
    userId,
    title: gEvent.summary ?? '(no title)',
    description: gEvent.description ?? undefined,
    startDate,
    endDate,
    allDay,
    color: cal.color ?? '#4285f4',
    googleEventId: gEvent.id,
    googleCalendarId: cal.googleId,
    googleCalendarName: cal.name,
    source: 'google',
  }

  const existingId = existingMap.get(gEvent.id)
  if (existingId) {
    await payload.update({
      collection: 'calendar-events',
      id: existingId,
      data: eventData as any,
    })
  } else {
    await payload.create({
      collection: 'calendar-events',
      data: eventData as any,
    })
  }
}

async function refreshGoogleToken(
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: string } | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
    return { accessToken: data.access_token, expiresAt }
  } catch {
    return null
  }
}
