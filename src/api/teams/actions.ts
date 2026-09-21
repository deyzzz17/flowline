'use server'

import 'server-only'

import { getSession } from '@/lib/get-session'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { getWorkspaceOwnerId } from '@/api/workspaces/actions'
import type { Plan } from '@/lib/stripe'

export interface TeamsAccess {
  /** `null` outside a real workspace — Teams don't exist in Personal. */
  ownerPlan: Plan | null
  hasAccess: boolean
}

// Teams are a Pro-only feature (unlimited once you have access, not a
// numeric cap) — gated by the WORKSPACE OWNER's plan, same as every other
// workspace-quota check in this app, not whoever happens to be looking.
export const getTeamsAccess = async (): Promise<TeamsAccess> => {
  const session = await getSession()
  const workspaceId = session?.session.activeOrganizationId ?? null
  if (!workspaceId) return { ownerPlan: null, hasAccess: false }

  const ownerId = await getWorkspaceOwnerId(workspaceId)
  if (!ownerId) return { ownerPlan: null, hasAccess: false }

  const { plan, limits } = await getPlanLimitsForUserId(ownerId)
  return { ownerPlan: plan, hasAccess: limits.teams > 0 }
}
