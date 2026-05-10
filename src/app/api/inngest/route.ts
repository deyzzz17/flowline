import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { syncRecurringTasks } from '@/inngest/functions/sync-recurring-tasks'
import { autoDeleteExpiredTasks } from '@/inngest/functions/auto-delete-expired-tasks'
import { cleanupTrashedTasks } from '@/inngest/functions/cleanup-trashed-task'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncRecurringTasks, autoDeleteExpiredTasks, cleanupTrashedTasks],
})
