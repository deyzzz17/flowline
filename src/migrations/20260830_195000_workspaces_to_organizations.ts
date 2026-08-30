import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lists" DROP CONSTRAINT "lists_workspace_id_workspaces_id_fk";
  ALTER TABLE "timer_categories" DROP CONSTRAINT "timer_categories_workspace_id_workspaces_id_fk";
  ALTER TABLE "timer_sessions" DROP CONSTRAINT "timer_sessions_workspace_id_workspaces_id_fk";
  ALTER TABLE "timer_configs" DROP CONSTRAINT "timer_configs_workspace_id_workspaces_id_fk";
  ALTER TABLE "calendar_categories" DROP CONSTRAINT "calendar_categories_workspace_id_workspaces_id_fk";
  ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_workspace_id_workspaces_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_workspaces_fk";

  ALTER TABLE "lists" ALTER COLUMN "workspace_id" TYPE text USING "workspace_id"::text;
  ALTER TABLE "lists" RENAME COLUMN "workspace_id" TO "workspace";
  ALTER TABLE "timer_categories" ALTER COLUMN "workspace_id" TYPE text USING "workspace_id"::text;
  ALTER TABLE "timer_categories" RENAME COLUMN "workspace_id" TO "workspace";
  ALTER TABLE "timer_sessions" ALTER COLUMN "workspace_id" TYPE text USING "workspace_id"::text;
  ALTER TABLE "timer_sessions" RENAME COLUMN "workspace_id" TO "workspace";
  ALTER TABLE "timer_configs" ALTER COLUMN "workspace_id" TYPE text USING "workspace_id"::text;
  ALTER TABLE "timer_configs" RENAME COLUMN "workspace_id" TO "workspace";
  ALTER TABLE "calendar_categories" ALTER COLUMN "workspace_id" TYPE text USING "workspace_id"::text;
  ALTER TABLE "calendar_categories" RENAME COLUMN "workspace_id" TO "workspace";
  ALTER TABLE "calendar_events" ALTER COLUMN "workspace_id" TYPE text USING "workspace_id"::text;
  ALTER TABLE "calendar_events" RENAME COLUMN "workspace_id" TO "workspace";

  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "workspaces_id";

  DROP TABLE "workspaces";

  -- The cast above preserves old "workspaces" row ids literally (e.g. "1",
  -- "2") as text, but those ids never match a real Better Auth organization
  -- (organization ids are random strings, never small integers) — every one
  -- of them is now orphaned. Reset them to NULL (Personal), which is what
  -- they represented before this migration in every observed case (each
  -- user's own single pre-organizations "Personal" workspace row).
  -- Requires the Better Auth "organization" table to already exist (applied
  -- separately via @better-auth/cli's own migration) — run that first.
  UPDATE "lists" SET "workspace" = NULL WHERE "workspace" IS NOT NULL AND "workspace" NOT IN (SELECT id FROM "organization");
  UPDATE "timer_categories" SET "workspace" = NULL WHERE "workspace" IS NOT NULL AND "workspace" NOT IN (SELECT id FROM "organization");
  UPDATE "timer_sessions" SET "workspace" = NULL WHERE "workspace" IS NOT NULL AND "workspace" NOT IN (SELECT id FROM "organization");
  UPDATE "timer_configs" SET "workspace" = NULL WHERE "workspace" IS NOT NULL AND "workspace" NOT IN (SELECT id FROM "organization");
  UPDATE "calendar_categories" SET "workspace" = NULL WHERE "workspace" IS NOT NULL AND "workspace" NOT IN (SELECT id FROM "organization");
  UPDATE "calendar_events" SET "workspace" = NULL WHERE "workspace" IS NOT NULL AND "workspace" NOT IN (SELECT id FROM "organization");

  CREATE UNIQUE INDEX "personal_list_user_slug_idx" ON "lists" USING btree ("user_id","slug") WHERE "workspace" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "personal_list_user_slug_idx";

  CREATE TABLE "workspaces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar DEFAULT 'Personal' NOT NULL,
  	"user_id" varchar NOT NULL,
  	"is_personal" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE INDEX "workspaces_user_id_idx" ON "workspaces" USING btree ("user_id");
  CREATE INDEX "workspaces_is_personal_idx" ON "workspaces" USING btree ("is_personal");
  CREATE INDEX "workspaces_updated_at_idx" ON "workspaces" USING btree ("updated_at");
  CREATE INDEX "workspaces_created_at_idx" ON "workspaces" USING btree ("created_at");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "workspaces_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workspaces_fk" FOREIGN KEY ("workspaces_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_workspaces_id_idx" ON "payload_locked_documents_rels" USING btree ("workspaces_id");

  ALTER TABLE "lists" RENAME COLUMN "workspace" TO "workspace_id";
  ALTER TABLE "lists" ALTER COLUMN "workspace_id" TYPE integer USING "workspace_id"::integer;
  ALTER TABLE "timer_categories" RENAME COLUMN "workspace" TO "workspace_id";
  ALTER TABLE "timer_categories" ALTER COLUMN "workspace_id" TYPE integer USING "workspace_id"::integer;
  ALTER TABLE "timer_sessions" RENAME COLUMN "workspace" TO "workspace_id";
  ALTER TABLE "timer_sessions" ALTER COLUMN "workspace_id" TYPE integer USING "workspace_id"::integer;
  ALTER TABLE "timer_configs" RENAME COLUMN "workspace" TO "workspace_id";
  ALTER TABLE "timer_configs" ALTER COLUMN "workspace_id" TYPE integer USING "workspace_id"::integer;
  ALTER TABLE "calendar_categories" RENAME COLUMN "workspace" TO "workspace_id";
  ALTER TABLE "calendar_categories" ALTER COLUMN "workspace_id" TYPE integer USING "workspace_id"::integer;
  ALTER TABLE "calendar_events" RENAME COLUMN "workspace" TO "workspace_id";
  ALTER TABLE "calendar_events" ALTER COLUMN "workspace_id" TYPE integer USING "workspace_id"::integer;

  ALTER TABLE "lists" ADD CONSTRAINT "lists_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "timer_categories" ADD CONSTRAINT "timer_categories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "timer_sessions" ADD CONSTRAINT "timer_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "timer_configs" ADD CONSTRAINT "timer_configs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "calendar_categories" ADD CONSTRAINT "calendar_categories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;`)
}
