import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { hourlyMaintenance } from '@/inngest/functions/maintenance'

// A single scheduled function — see maintenance.ts for why the former six
// separate crons (recurring tasks, auto-delete, trash/completions/habits
// cleanups, habits "sync") were merged.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [hourlyMaintenance],
})
