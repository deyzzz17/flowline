import 'server-only'
import { restoreAllArchivedListsForUserId } from '@/api/lists/internal'
import { restoreAllArchivedSharedListsForUserId } from '@/api/list-members/internal'
import { restoreAllArchivedTagsForUserId } from '@/api/tags/internal'
import { restoreAllArchivedCalendarCategoriesForUserId } from '@/api/calendar/internal'
import { restoreAllArchivedHabitsForUserId } from '@/api/habits/internal'
import {
  restoreAllArchivedTimerCategoriesForUserId,
  restoreAllArchivedTimerConfigsForUserId,
} from '@/api/timer/internal'
import {
  restoreAllArchivedWorkspaceMembersForUserId,
  restoreAllArchivedWorkspacesForUserId,
} from '@/api/workspaces/internal'

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
