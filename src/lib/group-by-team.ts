export interface TeamGroup<T> {
  teamId: number
  teamName: string
  items: T[]
}

/**
 * Splits a list of team-scopable items (lists, calendar categories) into
 * the workspace-wide ones (no team) and one group per team, in the same
 * order as the given `teams` list (already scoped to teams the current user
 * can actually see). A team the user isn't part of never produces a group,
 * even if a stale item somehow still points at it.
 */
export function groupByTeam<T>(
  items: T[],
  getTeamId: (item: T) => number | null,
  teams: { id: number; name: string }[],
): { noTeam: T[]; groups: TeamGroup<T>[] } {
  const noTeam: T[] = []
  const byTeam = new Map<number, T[]>()
  for (const item of items) {
    const teamId = getTeamId(item)
    if (teamId == null) {
      noTeam.push(item)
      continue
    }
    const arr = byTeam.get(teamId)
    if (arr) arr.push(item)
    else byTeam.set(teamId, [item])
  }
  const groups: TeamGroup<T>[] = teams
    .filter((t) => byTeam.has(t.id))
    .map((t) => ({ teamId: t.id, teamName: t.name, items: byTeam.get(t.id) ?? [] }))
  return { noTeam, groups }
}
