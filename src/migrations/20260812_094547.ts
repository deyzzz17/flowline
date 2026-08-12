import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "user_tags" ADD COLUMN "plan_archived_at" timestamp(3) with time zone;
  ALTER TABLE "habits" ADD COLUMN "plan_archived_at" timestamp(3) with time zone;
  CREATE INDEX "user_tags_plan_archived_at_idx" ON "user_tags" USING btree ("plan_archived_at");
  CREATE INDEX "habits_plan_archived_at_idx" ON "habits" USING btree ("plan_archived_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "user_tags_plan_archived_at_idx";
  DROP INDEX "habits_plan_archived_at_idx";
  ALTER TABLE "user_tags" DROP COLUMN "plan_archived_at";
  ALTER TABLE "habits" DROP COLUMN "plan_archived_at";`)
}
