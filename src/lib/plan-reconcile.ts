import 'server-only'
import { restoreAllArchivedListsForUserId } from '@/api/lists/actions'
import { restoreAllArchivedSharedListsForUserId } from '@/api/list-members/actions'
import { restoreAllArchivedTagsForUserId } from '@/api/tags/actions'
import { restoreAllArchivedCalendarCategoriesForUserId } from '@/api/calendar/actions'
import { restoreAllArchivedHabitsForUserId } from '@/api/habits/actions'
import {
  restoreAllArchivedTimerCategoriesForUserId,
  restoreAllArchivedTimerConfigsForUserId,
} from '@/api/timer/actions'
import {
  restoreAllArchivedWorkspaceMembersForUserId,
  restoreAllArchivedWorkspacesForUserId,
} from '@/api/workspaces/actions'

export async function reconcilePlanArchivedEntities(userId: string): Promise<void> {
  // Workspaces first — restoring one frees no member seats by itself (the
  // organization was never touched while archived), but running it before
  // the per-workspace member restore keeps the ordering intuitive: the
  // workspace itself comes back, then its members fill back in.
  await restoreAllArchivedWorkspacesForUserId(userId)

  await Promise.all([
    restoreAllArchivedListsForUserId(userId),
    restoreAllArchivedSharedListsForUserId(userId),
    restoreAllArchivedTagsForUserId(userId),
    restoreAllArchivedCalendarCategoriesForUserId(userId),
    restoreAllArchivedHabitsForUserId(userId),
    restoreAllArchivedTimerCategoriesForUserId(userId),
    restoreAllArchivedTimerConfigsForUserId(userId),
    restoreAllArchivedWorkspaceMembersForUserId(userId),
  ])
}
