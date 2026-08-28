'use server'

import 'server-only'

import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ok, err } from '@/types/result'
import { getSession } from '@/lib/get-session'
import { getUserPlanLimits } from '@/lib/get-user-plan'
import { getOrCreatePersonalWorkspace } from '@/lib/get-or-create-workspace'
import { getCurrentWorkspace, ACTIVE_WORKSPACE_COOKIE } from '@/lib/get-current-workspace'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export const listWorkspaces = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [], activeId: null }

  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'workspaces',
    where: { userId: { equals: userId } },
    sort: 'createdAt',
    limit: 0,
  })

  // Almost always already there — only ever missing for a brand-new account,
  // so this extra round trip is skipped in the common case.
  const allDocs = docs.some((w) => w.isPersonal)
    ? docs
    : [...docs, await getOrCreatePersonalWorkspace(payload, userId)]

  const activeWorkspace = await getCurrentWorkspace(payload, userId, allDocs)

  return {
    docs: [...allDocs].sort((a, b) => Number(b.isPersonal) - Number(a.isPersonal)),
    activeId: activeWorkspace.id,
  }
}

async function countExtraWorkspaces(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: string,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'workspaces',
    where: {
      and: [{ userId: { equals: userId } }, { isPersonal: { equals: false } }],
    },
    limit: 0,
  })
  return totalDocs
}

export const createWorkspace = async (name: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const trimmed = name.trim()
    if (!trimmed) return err('Name is required')

    const payload = await getPayload({ config })
    const { plan, limits } = await getUserPlanLimits()

    const extraCount = await countExtraWorkspaces(payload, userId)
    if (isAtLimit(extraCount, limits.workspaces)) {
      return err(
        isPlanUnlimited(plan, 'workspaces')
          ? SAFETY_CAP_ERRORS.WORKSPACES_CAP
          : LIMIT_ERRORS.WORKSPACES_LIMIT,
      )
    }

    const workspace = await payload.create({
      collection: 'workspaces',
      data: { name: trimmed, userId, isPersonal: false },
    })

    return ok(workspace)
  } catch {
    return err('Error while creating the workspace')
  }
}

export const switchWorkspace = async (workspaceId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const workspace = await payload.findByID({ collection: 'workspaces', id: workspaceId })
    if (!workspace || workspace.userId !== userId) return err('Not authorized')

    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, String(workspaceId), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })

    return ok(true)
  } catch {
    return err('Error while switching workspace')
  }
}
