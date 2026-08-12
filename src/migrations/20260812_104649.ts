import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "timer_categories" ADD COLUMN "plan_archived_at" timestamp(3) with time zone;
  ALTER TABLE "timer_configs" ADD COLUMN "plan_archived_at" timestamp(3) with time zone;
  ALTER TABLE "calendar_categories" ADD COLUMN "plan_archived_at" timestamp(3) with time zone;
  CREATE INDEX "timer_categories_plan_archived_at_idx" ON "timer_categories" USING btree ("plan_archived_at");
  CREATE INDEX "timer_configs_plan_archived_at_idx" ON "timer_configs" USING btree ("plan_archived_at");
  CREATE INDEX "calendar_categories_plan_archived_at_idx" ON "calendar_categories" USING btree ("plan_archived_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "timer_categories_plan_archived_at_idx";
  DROP INDEX "timer_configs_plan_archived_at_idx";
  DROP INDEX "calendar_categories_plan_archived_at_idx";
  ALTER TABLE "timer_categories" DROP COLUMN "plan_archived_at";
  ALTER TABLE "timer_configs" DROP COLUMN "plan_archived_at";
  ALTER TABLE "calendar_categories" DROP COLUMN "plan_archived_at";`)
}
