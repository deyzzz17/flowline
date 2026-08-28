import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "calendar_events" ADD COLUMN "workspace_id" integer;
  ALTER TABLE "calendar_categories" ADD COLUMN "workspace_id" integer;
  ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "calendar_categories" ADD CONSTRAINT "calendar_categories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "workspace_slug_idx" ON "lists" USING btree ("workspace_id","slug");
  CREATE INDEX "calendar_events_workspace_idx" ON "calendar_events" USING btree ("workspace_id");
  CREATE INDEX "calendar_categories_workspace_idx" ON "calendar_categories" USING btree ("workspace_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_workspace_id_workspaces_id_fk";
  
  ALTER TABLE "calendar_categories" DROP CONSTRAINT "calendar_categories_workspace_id_workspaces_id_fk";
  
  DROP INDEX "workspace_slug_idx";
  DROP INDEX "calendar_events_workspace_idx";
  DROP INDEX "calendar_categories_workspace_idx";
  ALTER TABLE "calendar_events" DROP COLUMN "workspace_id";
  ALTER TABLE "calendar_categories" DROP COLUMN "workspace_id";`)
}
