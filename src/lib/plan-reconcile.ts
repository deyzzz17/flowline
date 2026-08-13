import 'server-only'
import { restoreAllArchivedListsForUserId } from '@/api/lists/actions'
import { restoreAllArchivedTagsForUserId } from '@/api/tags/actions'
import { restoreAllArchivedCalendarCategoriesForUserId } from '@/api/calendar/actions'

export async function reconcilePlanArchivedEntities(userId: string): Promise<void> {
  await Promise.all([
    restoreAllArchivedListsForUserId(userId),
    restoreAllArchivedTagsForUserId(userId),
    restoreAllArchivedCalendarCategoriesForUserId(userId),
  ])
}
