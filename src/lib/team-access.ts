import 'server-only'

import type { getPayload } from 'payload'

/**
 * Every team (in this workspace) the user has real access to — either as an
 * explicit team-member row, or as the team's own creator (who isn't always
 * also added as a member). Used to filter team-scoped resources (lists,
 * calendar categories) down to what a given user's team membership actually
 * entitles them to see.
 */
export async function getMyTeamIds(
  payload: Awaited<ReturnType<typeof getPayload>>,
  workspaceId: string,
  userId: string,
): Promise<number[]> {
  const [{ docs: memberDocs }, { docs: createdTeams }] = await Promise.all([
    payload.find({
      collection: 'team-members',
      where: { userId: { equals: userId } },
      limit: 0,
      depth: 0,
    }),
    payload.find({
      collection: 'teams',
      where: { and: [{ workspace: { equals: workspaceId } }, { createdBy: { equals: userId } }] },
      limit: 0,
    }),
  ])
  const memberTeamIds = memberDocs
    .map((d) => (typeof d.team === 'object' ? d.team?.id : d.team))
    .filter((id): id is number => typeof id === 'number')
  return [...new Set([...memberTeamIds, ...createdTeams.map((t) => t.id)])]
}
