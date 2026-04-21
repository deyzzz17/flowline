import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tasks" ADD COLUMN "trashed_at" timestamp(3) with time zone;
  CREATE INDEX "tasks_trashed_at_idx" ON "tasks" USING btree ("trashed_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "tasks_trashed_at_idx";
  ALTER TABLE "tasks" DROP COLUMN "trashed_at";`)
}
