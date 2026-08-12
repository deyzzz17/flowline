import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tasks" ADD COLUMN "plan_archived_at" timestamp(3) with time zone;
  ALTER TABLE "lists" ADD COLUMN "plan_archived_at" timestamp(3) with time zone;
  CREATE INDEX "tasks_plan_archived_at_idx" ON "tasks" USING btree ("plan_archived_at");
  CREATE INDEX "lists_plan_archived_at_idx" ON "lists" USING btree ("plan_archived_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "tasks_plan_archived_at_idx";
  DROP INDEX "lists_plan_archived_at_idx";
  ALTER TABLE "tasks" DROP COLUMN "plan_archived_at";
  ALTER TABLE "lists" DROP COLUMN "plan_archived_at";`)
}
