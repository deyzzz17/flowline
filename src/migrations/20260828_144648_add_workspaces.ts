import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "workspaces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar DEFAULT 'Personal' NOT NULL,
  	"user_id" varchar NOT NULL,
  	"is_personal" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "lists" ADD COLUMN "workspace_id" integer;
  ALTER TABLE "timer_categories" ADD COLUMN "workspace_id" integer;
  ALTER TABLE "timer_sessions" ADD COLUMN "workspace_id" integer;
  ALTER TABLE "timer_configs" ADD COLUMN "workspace_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "workspaces_id" integer;
  CREATE INDEX "workspaces_user_id_idx" ON "workspaces" USING btree ("user_id");
  CREATE INDEX "workspaces_is_personal_idx" ON "workspaces" USING btree ("is_personal");
  CREATE INDEX "workspaces_updated_at_idx" ON "workspaces" USING btree ("updated_at");
  CREATE INDEX "workspaces_created_at_idx" ON "workspaces" USING btree ("created_at");
  ALTER TABLE "lists" ADD CONSTRAINT "lists_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "timer_categories" ADD CONSTRAINT "timer_categories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "timer_sessions" ADD CONSTRAINT "timer_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "timer_configs" ADD CONSTRAINT "timer_configs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workspaces_fk" FOREIGN KEY ("workspaces_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lists_workspace_idx" ON "lists" USING btree ("workspace_id");
  CREATE INDEX "timer_categories_workspace_idx" ON "timer_categories" USING btree ("workspace_id");
  CREATE INDEX "timer_sessions_workspace_idx" ON "timer_sessions" USING btree ("workspace_id");
  CREATE INDEX "timer_configs_workspace_idx" ON "timer_configs" USING btree ("workspace_id");
  CREATE INDEX "payload_locked_documents_rels_workspaces_id_idx" ON "payload_locked_documents_rels" USING btree ("workspaces_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workspaces" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "workspaces" CASCADE;
  ALTER TABLE "lists" DROP CONSTRAINT "lists_workspace_id_workspaces_id_fk";
  
  ALTER TABLE "timer_categories" DROP CONSTRAINT "timer_categories_workspace_id_workspaces_id_fk";
  
  ALTER TABLE "timer_sessions" DROP CONSTRAINT "timer_sessions_workspace_id_workspaces_id_fk";
  
  ALTER TABLE "timer_configs" DROP CONSTRAINT "timer_configs_workspace_id_workspaces_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_workspaces_fk";
  
  DROP INDEX "lists_workspace_idx";
  DROP INDEX "timer_categories_workspace_idx";
  DROP INDEX "timer_sessions_workspace_idx";
  DROP INDEX "timer_configs_workspace_idx";
  DROP INDEX "payload_locked_documents_rels_workspaces_id_idx";
  ALTER TABLE "lists" DROP COLUMN "workspace_id";
  ALTER TABLE "timer_categories" DROP COLUMN "workspace_id";
  ALTER TABLE "timer_sessions" DROP COLUMN "workspace_id";
  ALTER TABLE "timer_configs" DROP COLUMN "workspace_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "workspaces_id";`)
}
