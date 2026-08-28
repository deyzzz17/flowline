import 'server-only'

import { cookies } from 'next/headers'
import type { Payload } from 'payload'
import { getOrCreatePersonalWorkspace } from './get-or-create-workspace'

export const ACTIVE_WORKSPACE_COOKIE = 'active_workspace'

export async function getCurrentWorkspaceId(payload: Payload, userId: string): Promise<number> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value
  const candidateId = raw ? Number(raw) : null

  if (candidateId) {
    const workspace = await payload
      .findByID({ collection: 'workspaces', id: candidateId })
      .catch(() => null)
    if (workspace && workspace.userId === userId) return workspace.id
  }

  const personal = await getOrCreatePersonalWorkspace(payload, userId)
  return personal.id
}
