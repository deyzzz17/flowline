import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { syncRecurringTasks } from '@/inngest/functions/sync-recurring-tasks'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncRecurringTasks],
})
