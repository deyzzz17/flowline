import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Mirrors the schema Payload's own dev-mode push already created for the
// `CustomRoles` collection (src/collections/CustomRoles.ts) — this makes
// that same schema change reproducible against any other environment.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_custom_roles_base_tier" AS ENUM('admin', 'member');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE TABLE IF NOT EXISTS "custom_roles" (
      "id" serial PRIMARY KEY NOT NULL,
      "workspace" varchar NOT NULL,
      "name" varchar NOT NULL,
      "base_tier" "enum_custom_roles_base_tier" DEFAULT 'member' NOT NULL,
      "can_modify_content" boolean DEFAULT true,
      "can_permanently_delete_tasks" boolean DEFAULT false,
      "can_delete_calendar_categories" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "custom_roles_workspace_idx" ON "custom_roles" USING btree ("workspace");
    CREATE UNIQUE INDEX IF NOT EXISTS "custom_roles_workspace_name_idx" ON "custom_roles" USING btree ("workspace","name");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "custom_roles";
    DROP TYPE IF EXISTS "enum_custom_roles_base_tier";
  `)
}
