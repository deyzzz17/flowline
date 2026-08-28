import 'server-only'

import { cookies } from 'next/headers'
import type { Payload } from 'payload'
import type { Workspace } from '@/payload-types'
import { getOrCreatePersonalWorkspace } from './get-or-create-workspace'

export const ACTIVE_WORKSPACE_COOKIE = 'active_workspace'

/**
 * Resolves the active workspace. Pass `knownWorkspaces` (e.g. from a prior
 * `payload.find`) when the caller already has the user's full workspace list in
 * memory, to skip an extra `findByID`/create round trip.
 */
export async function getCurrentWorkspace(
  payload: Payload,
  userId: string,
  knownWorkspaces?: Workspace[],
): Promise<Workspace> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value
  const candidateId = raw ? Number(raw) : null

  if (candidateId) {
    if (knownWorkspaces) {
      const match = knownWorkspaces.find((w) => w.id === candidateId && w.userId === userId)
      if (match) return match
    } else {
      const workspace = await payload
        .findByID({ collection: 'workspaces', id: candidateId })
        .catch(() => null)
      if (workspace && workspace.userId === userId) return workspace
    }
  }

  const personalFromKnown = knownWorkspaces?.find((w) => w.isPersonal)
  if (personalFromKnown) return personalFromKnown

  return getOrCreatePersonalWorkspace(payload, userId)
}

export async function getCurrentWorkspaceId(payload: Payload, userId: string): Promise<number> {
  return (await getCurrentWorkspace(payload, userId)).id
}
