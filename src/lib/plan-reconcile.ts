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

export async function reconcilePlanArchivedEntities(userId: string): Promise<void> {
  await Promise.all([
    restoreAllArchivedListsForUserId(userId),
    restoreAllArchivedSharedListsForUserId(userId),
    restoreAllArchivedTagsForUserId(userId),
    restoreAllArchivedCalendarCategoriesForUserId(userId),
    restoreAllArchivedHabitsForUserId(userId),
    restoreAllArchivedTimerCategoriesForUserId(userId),
    restoreAllArchivedTimerConfigsForUserId(userId),
  ])
}
