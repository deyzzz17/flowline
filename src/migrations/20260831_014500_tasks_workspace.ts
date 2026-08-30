import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tasks" ADD COLUMN "workspace" text;
  ALTER TABLE "task_completions" ADD COLUMN "workspace" text;
  CREATE INDEX "tasks_workspace_idx" ON "tasks" USING btree ("workspace");
  CREATE INDEX "task_completions_workspace_idx" ON "task_completions" USING btree ("workspace");

  -- Backfill from the parent list's workspace for tasks that belong to one;
  -- listless tasks default to NULL (Personal), matching how every other
  -- workspace-scoped collection was backfilled in the phase-8 migration.
  UPDATE "tasks" t SET "workspace" = l."workspace" FROM "lists" l WHERE t."list_id" = l."id" AND l."workspace" IS NOT NULL;
  UPDATE "task_completions" tc SET "workspace" = t."workspace" FROM "tasks" t WHERE tc."task_id" = t."id" AND t."workspace" IS NOT NULL;
  UPDATE "task_completions" tc SET "workspace" = l."workspace" FROM "lists" l WHERE tc."workspace" IS NULL AND tc."list_id" = l."id" AND l."workspace" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "tasks_workspace_idx";
  DROP INDEX "task_completions_workspace_idx";
  ALTER TABLE "tasks" DROP COLUMN "workspace";
  ALTER TABLE "task_completions" DROP COLUMN "workspace";`)
}
