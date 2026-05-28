'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ok, err } from '@/types/result'

const getUserId = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

const getGoogleAccessToken = async (userId: string): Promise<string | null> => {
  try {
    const { Pool } = await import('pg')
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const result = await pool.query(
      `SELECT "accessToken" FROM account WHERE "userId" = $1 AND "providerId" = 'google' LIMIT 1`,
      [userId],
    )
    await pool.end()
    return result.rows[0]?.accessToken ?? null
  } catch {
    return null
  }
}

export const getGoogleCalendarStatus = async () => {
  const userId = await getUserId()
  if (!userId) return { connected: false }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'google-calendar-syncs',
    where: { userId: { equals: userId } },
    limit: 1,
  })

  if (docs.length === 0) return { connected: false }

  const sync = docs[0] as any
  return {
    connected: sync.status === 'connected',
    status: sync.status,
    lastSyncedAt: sync.lastSyncedAt,
    calendars: sync.calendars ?? [],
  }
}

export const connectGoogleCalendar = async () => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const accessToken = await getGoogleAccessToken(userId)
    if (!accessToken) return err('No Google access token — please sign in with Google first')

    const calListRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!calListRes.ok) {
      const errData = await calListRes.json()
      return err(errData.error?.message ?? 'Failed to fetch Google calendars')
    }

    const calListData = await calListRes.json()
    const calendars = (calListData.items ?? []).map((cal: any) => ({
      googleId: cal.id,
      name: cal.summary,
      color: cal.backgroundColor ?? '#4285f4',
      primary: cal.primary ?? false,
      enabled: true,
    }))

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'google-calendar-syncs',
      where: { userId: { equals: userId } },
      limit: 1,
    })

    if (docs.length > 0) {
      await payload.update({
        collection: 'google-calendar-syncs',
        id: docs[0].id,
        data: { status: 'connected', calendars, errorMessage: undefined } as any,
      })
    } else {
      await payload.create({
        collection: 'google-calendar-syncs',
        data: { userId, status: 'connected', calendars } as any,
      })
    }

    return ok({ calendars })
  } catch (e) {
    console.error(e)
    return err('Error connecting Google Calendar')
  }
}

export const disconnectGoogleCalendar = async () => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'google-calendar-syncs',
      where: { userId: { equals: userId } },
      limit: 1,
    })
    if (docs.length > 0) {
      await payload.delete({ collection: 'google-calendar-syncs', id: docs[0].id })
    }

    return ok(true)
  } catch (e) {
    console.error(e)
    return err('Error disconnecting Google Calendar')
  }
}

export const updateGoogleCalendarSettings = async (
  calendars: { googleId: string; enabled: boolean }[],
) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'google-calendar-syncs',
      where: { userId: { equals: userId } },
      limit: 1,
    })

    if (docs.length === 0) return err('Not connected')

    const sync = docs[0] as any
    const updatedCalendars = (sync.calendars ?? []).map((cal: any) => {
      const update = calendars.find((c) => c.googleId === cal.googleId)
      return update ? { ...cal, enabled: update.enabled } : cal
    })

    await payload.update({
      collection: 'google-calendar-syncs',
      id: docs[0].id,
      data: { calendars: updatedCalendars } as any,
    })

    return ok(true)
  } catch (e) {
    return err('Error updating settings')
  }
}

export const refreshGoogleCalendars = async () => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'google-calendar-syncs',
      where: { userId: { equals: userId } },
      limit: 1,
    })
    if (docs.length === 0) return err('Not connected')

    const { Pool } = await import('pg')
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const result = await pool.query(
      `SELECT "accessToken" FROM account WHERE "userId" = $1 AND "providerId" = 'google' LIMIT 1`,
      [userId],
    )
    await pool.end()
    const accessToken = result.rows[0]?.accessToken
    if (!accessToken) return err('No access token')

    const calListRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!calListRes.ok) return err('Failed to fetch calendars')

    const calListData = await calListRes.json()
    const sync = docs[0] as any
    const freshCalendars = (calListData.items ?? []).map((cal: any) => {
      const existing = (sync.calendars ?? []).find((c: any) => c.googleId === cal.id)
      return {
        googleId: cal.id,
        name: cal.summary,
        color: cal.backgroundColor ?? '#4285f4',
        primary: cal.primary ?? false,
        enabled: existing ? existing.enabled : true,
      }
    })

    await payload.update({
      collection: 'google-calendar-syncs',
      id: docs[0].id,
      data: { calendars: freshCalendars } as any,
    })

    return ok({ calendars: freshCalendars })
  } catch (e) {
    return err('Error refreshing calendars')
  }
}
