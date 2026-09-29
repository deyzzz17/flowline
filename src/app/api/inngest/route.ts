import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { dailyMaintenance } from '@/inngest/functions/maintenance'

// A single daily function — see maintenance.ts for why the former six
// separate crons (recurring tasks, auto-delete, trash/completions/habits
// cleanups, habits "sync") were merged.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dailyMaintenance],
})
