import 'server-only'
import { restoreAllArchivedListsForUserId } from '@/api/lists/actions'
import { restoreAllArchivedTagsForUserId } from '@/api/tags/actions'

export async function reconcilePlanArchivedEntities(userId: string): Promise<void> {
  await Promise.all([
    restoreAllArchivedListsForUserId(userId),
    restoreAllArchivedTagsForUserId(userId),
  ])
}
