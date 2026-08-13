import 'server-only'
import { restoreAllArchivedListsForUserId } from '@/api/lists/actions'
import { restoreAllArchivedTagsForUserId } from '@/api/tags/actions'
import { restoreAllArchivedCalendarCategoriesForUserId } from '@/api/calendar/actions'
import { restoreAllArchivedHabitsForUserId } from '@/api/habits/actions'

export async function reconcilePlanArchivedEntities(userId: string): Promise<void> {
  await Promise.all([
    restoreAllArchivedListsForUserId(userId),
    restoreAllArchivedTagsForUserId(userId),
    restoreAllArchivedCalendarCategoriesForUserId(userId),
    restoreAllArchivedHabitsForUserId(userId),
  ])
}
