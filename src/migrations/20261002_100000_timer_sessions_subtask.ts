import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Focus sessions can target a subtask (`subtaskId`, the subtask's array-row
// id). `task_id` stays set to the parent task, so the parent's focus time is
// the sum of its own sessions and its subtasks' sessions.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "timer_sessions" ADD COLUMN IF NOT EXISTS "subtask_id" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "timer_sessions" DROP COLUMN IF EXISTS "subtask_id";
  `)
}
