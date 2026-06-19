'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ok, err } from '@/types/result'
import { Pool } from 'pg'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/get-session'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

const getCurrentUser = async () => {
  const session = await getSession()
  return session?.user ?? null
}

export interface ContactProfile {
  id: string
  name: string
  email: string
  image: string | null
}

export type RelationshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

export interface ContactSearchResult {
  user: ContactProfile
  relationship: RelationshipStatus
  connectionId: number | null
}

export interface PendingRequest {
  connectionId: number
  user: ContactProfile
  createdAt: string
}

export interface Contact {
  connectionId: number
  user: ContactProfile
  connectedAt: string
}

export interface RecentItem {
  type: 'connection_accepted'
  connectionId: number
  user: ContactProfile
  at: string
}

async function findUserByEmail(email: string): Promise<ContactProfile | null> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(
      `SELECT id, name, email, image FROM "user" WHERE email = $1 LIMIT 1`,
      [email.trim().toLowerCase()],
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return { id: row.id, name: row.name, email: row.email, image: row.image ?? null }
  } finally {
    await pool.end()
  }
}

async function findUsersByIds(ids: string[]): Promise<Map<string, ContactProfile>> {
  const map = new Map<string, ContactProfile>()
  if (ids.length === 0) return map
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(
      `SELECT id, name, email, image FROM "user" WHERE id = ANY($1::text[])`,
      [ids],
    )
    for (const row of result.rows) {
      map.set(row.id, { id: row.id, name: row.name, email: row.email, image: row.image ?? null })
    }
    return map
  } finally {
    await pool.end()
  }
}

export const searchContactByEmail = async (
  email: string,
): Promise<{ ok: true; value: ContactSearchResult | null } | { ok: false; error: string }> => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`search-contact:${userId}`, 5, 1000)) {
      return err('Too many requests. Please wait a moment.')
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return ok(null)

    const currentUser = await getCurrentUser()
    if (currentUser?.email?.toLowerCase() === normalizedEmail) {
      // On ne révèle rien de spécial, on traite simplement comme "introuvable"
      // pour ne pas permettre de s'auto-inviter.
      return ok(null)
    }

    const foundUser = await findUserByEmail(normalizedEmail)
    if (!foundUser) return ok(null)

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'connections',
      where: {
        or: [
          {
            and: [{ requesterId: { equals: userId } }, { recipientId: { equals: foundUser.id } }],
          },
          {
            and: [{ requesterId: { equals: foundUser.id } }, { recipientId: { equals: userId } }],
          },
        ],
      },
      limit: 1,
    })

    let relationship: RelationshipStatus = 'none'
    let connectionId: number | null = null

    if (docs.length > 0) {
      const connection = docs[0]
      connectionId = connection.id
      if (connection.status === 'accepted') {
        relationship = 'accepted'
      } else if (connection.requesterId === userId) {
        relationship = 'pending_sent'
      } else {
        relationship = 'pending_received'
      }
    }

    return ok({ user: foundUser, relationship, connectionId })
  } catch {
    return err('Error searching for contact')
  }
}

export const sendConnectionRequest = async (recipientUserId: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`send-connection:${userId}`, 5, 60_000)) {
      return err('Too many requests. Please wait a moment.')
    }

    if (userId === recipientUserId) return err('You cannot connect with yourself.')

    const payload = await getPayload({ config })
    const created = await payload.create({
      collection: 'connections',
      data: {
        requesterId: userId,
        recipientId: recipientUserId,
        status: 'pending',
      },
    })

    return ok(created)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error sending connection request'
    return err(message)
  }
}

export const acceptConnectionRequest = async (connectionId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const connection = await payload.findByID({ collection: 'connections', id: connectionId })

    if (!connection || connection.recipientId !== userId) {
      return err('Not authorized')
    }
    if (connection.status !== 'pending') {
      return err('This request is no longer pending')
    }

    const updated = await payload.update({
      collection: 'connections',
      id: connectionId,
      data: {
        status: 'accepted',
        respondedAt: new Date().toISOString(),
      },
    })

    return ok(updated)
  } catch {
    return err('Error accepting connection request')
  }
}

export const declineConnectionRequest = async (connectionId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const connection = await payload.findByID({ collection: 'connections', id: connectionId })

    if (!connection || connection.recipientId !== userId) {
      return err('Not authorized')
    }
    if (connection.status !== 'pending') {
      return err('This request is no longer pending')
    }

    // Suppression complète (pas de soft-delete) — permet à l'autre personne
    // de renvoyer une demande plus tard sans contrainte d'unicité bloquante.
    await payload.delete({ collection: 'connections', id: connectionId })

    return ok(true)
  } catch {
    return err('Error declining connection request')
  }
}

export const listPendingRequests = async (): Promise<PendingRequest[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'connections',
    where: {
      and: [{ recipientId: { equals: userId } }, { status: { equals: 'pending' } }],
    },
    sort: '-createdAt',
    limit: 0,
  })

  if (docs.length === 0) return []

  const requesterIds = docs.map((d) => d.requesterId as string)
  const usersMap = await findUsersByIds(requesterIds)

  return docs
    .map((d) => {
      const user = usersMap.get(d.requesterId as string)
      if (!user) return null
      return {
        connectionId: d.id,
        user,
        createdAt: d.createdAt as string,
      }
    })
    .filter((x): x is PendingRequest => x !== null)
}

export const listSentPendingRequests = async (): Promise<PendingRequest[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'connections',
    where: {
      and: [{ requesterId: { equals: userId } }, { status: { equals: 'pending' } }],
    },
    sort: '-createdAt',
    limit: 0,
  })

  if (docs.length === 0) return []

  const recipientIds = docs.map((d) => d.recipientId as string)
  const usersMap = await findUsersByIds(recipientIds)

  return docs
    .map((d) => {
      const user = usersMap.get(d.recipientId as string)
      if (!user) return null
      return {
        connectionId: d.id,
        user,
        createdAt: d.createdAt as string,
      }
    })
    .filter((x): x is PendingRequest => x !== null)
}

export const listContacts = async (
  page = 1,
  pageSize = 10,
): Promise<{ docs: Contact[]; hasMore: boolean; total: number }> => {
  const userId = await getUserId()
  if (!userId) return { docs: [], hasMore: false, total: 0 }

  const payload = await getPayload({ config })
  const { docs: allDocs } = await payload.find({
    collection: 'connections',
    where: {
      and: [
        { status: { equals: 'accepted' } },
        { or: [{ requesterId: { equals: userId } }, { recipientId: { equals: userId } }] },
      ],
    },
    limit: 0,
  })

  if (allDocs.length === 0) return { docs: [], hasMore: false, total: 0 }

  const otherUserIds = allDocs.map((d) =>
    d.requesterId === userId ? (d.recipientId as string) : (d.requesterId as string),
  )
  const usersMap = await findUsersByIds(otherUserIds)

  const allContacts: Contact[] = allDocs
    .map((d) => {
      const otherUserId = d.requesterId === userId ? d.recipientId : d.requesterId
      const user = usersMap.get(otherUserId as string)
      if (!user) return null
      return {
        connectionId: d.id,
        user,
        connectedAt: (d.respondedAt as string) ?? (d.createdAt as string),
      }
    })
    .filter((x): x is Contact => x !== null)
    .sort((a, b) => a.user.name.localeCompare(b.user.name))

  const total = allContacts.length
  const paged = allContacts.slice(0, page * pageSize)
  const hasMore = paged.length < total

  return { docs: paged, hasMore, total }
}

export const listRecentConnections = async (): Promise<RecentItem[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { docs } = await payload.find({
    collection: 'connections',
    where: {
      and: [
        { status: { equals: 'accepted' } },
        { or: [{ requesterId: { equals: userId } }, { recipientId: { equals: userId } }] },
        { respondedAt: { greater_than_equal: thirtyDaysAgo.toISOString() } },
      ],
    },
    sort: '-respondedAt',
    limit: 20,
  })

  if (docs.length === 0) return []

  const otherUserIds = docs.map((d) =>
    d.requesterId === userId ? (d.recipientId as string) : (d.requesterId as string),
  )
  const usersMap = await findUsersByIds(otherUserIds)

  return docs
    .map((d) => {
      const otherUserId = d.requesterId === userId ? d.recipientId : d.requesterId
      const user = usersMap.get(otherUserId as string)
      if (!user) return null
      return {
        type: 'connection_accepted' as const,
        connectionId: d.id,
        user,
        at: (d.respondedAt as string) ?? (d.createdAt as string),
      }
    })
    .filter((x): x is RecentItem => x !== null)
}
