import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "timer_configs" DROP COLUMN "workspace";
  ALTER TABLE "timer_sessions" DROP COLUMN "workspace";
  ALTER TABLE "timer_categories" DROP COLUMN "workspace";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "timer_configs" ADD COLUMN "workspace" text;
  ALTER TABLE "timer_sessions" ADD COLUMN "workspace" text;
  ALTER TABLE "timer_categories" ADD COLUMN "workspace" text;
  CREATE INDEX "timer_configs_workspace_idx" ON "timer_configs" USING btree ("workspace");
  CREATE INDEX "timer_sessions_workspace_idx" ON "timer_sessions" USING btree ("workspace");
  CREATE INDEX "timer_categories_workspace_idx" ON "timer_categories" USING btree ("workspace");`)
}
