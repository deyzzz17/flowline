import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tasks" ADD COLUMN "completed_at" timestamp(3) with time zone;
  ALTER TABLE "tasks" ADD COLUMN "estimated_duration" numeric;
  CREATE INDEX "tasks_completed_at_idx" ON "tasks" USING btree ("completed_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "tasks_completed_at_idx";
  ALTER TABLE "tasks" DROP COLUMN "completed_at";
  ALTER TABLE "tasks" DROP COLUMN "estimated_duration";`)
}
