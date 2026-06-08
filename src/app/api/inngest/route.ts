import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { syncRecurringTasks } from '@/inngest/functions/sync-recurring-tasks'
import { autoDeleteExpiredTasks } from '@/inngest/functions/auto-delete-expired-tasks'
import { cleanupTrashedTasks } from '@/inngest/functions/cleanup-trashed-task'
import { cleanupArchivedHabits } from '@/inngest/functions/cleanup-archived-habits'
import { syncHabits } from '@/inngest/functions/sync-habits'
import { migrateTaskCompletions } from '@/inngest/functions/migrate-task-completions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncRecurringTasks,
    autoDeleteExpiredTasks,
    cleanupTrashedTasks,
    cleanupArchivedHabits,
    syncHabits,
    migrateTaskCompletions,
  ],
})
