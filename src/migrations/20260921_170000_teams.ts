import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Mirrors the schema Payload's own dev-mode push already created for the
// Teams / TeamRoles / TeamMembers collections, plus the optional `team`
// relationship added to Lists and CalendarCategories.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "teams" (
      "id" serial PRIMARY KEY NOT NULL,
      "workspace" varchar NOT NULL,
      "name" varchar NOT NULL,
      "created_by" varchar NOT NULL,
      "plan_archived_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "teams_workspace_idx" ON "teams" USING btree ("workspace");
    CREATE INDEX IF NOT EXISTS "teams_created_by_idx" ON "teams" USING btree ("created_by");
    CREATE INDEX IF NOT EXISTS "teams_plan_archived_at_idx" ON "teams" USING btree ("plan_archived_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "teams_workspace_name_idx" ON "teams" USING btree ("workspace","name");

    CREATE TABLE IF NOT EXISTS "team_roles" (
      "id" serial PRIMARY KEY NOT NULL,
      "team_id" integer,
      "name" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "team_roles_team_idx" ON "team_roles" USING btree ("team_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "team_roles_team_name_idx" ON "team_roles" USING btree ("team_id","name");

    CREATE TABLE IF NOT EXISTS "team_members" (
      "id" serial PRIMARY KEY NOT NULL,
      "team_id" integer,
      "user_id" varchar NOT NULL,
      "team_role_id" integer,
      "added_by" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "team_members_team_idx" ON "team_members" USING btree ("team_id");
    CREATE INDEX IF NOT EXISTS "team_members_user_id_idx" ON "team_members" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "team_members_team_role_idx" ON "team_members" USING btree ("team_role_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_user_idx" ON "team_members" USING btree ("team_id","user_id");

    DO $$ BEGIN
      ALTER TABLE "team_roles" ADD CONSTRAINT "team_roles_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_role_id_team_roles_id_fk" FOREIGN KEY ("team_role_id") REFERENCES "team_roles"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    ALTER TABLE "lists" ADD COLUMN IF NOT EXISTS "team_id" integer;
    CREATE INDEX IF NOT EXISTS "lists_team_idx" ON "lists" USING btree ("team_id");
    DO $$ BEGIN
      ALTER TABLE "lists" ADD CONSTRAINT "lists_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    ALTER TABLE "calendar_categories" ADD COLUMN IF NOT EXISTS "team_id" integer;
    CREATE INDEX IF NOT EXISTS "calendar_categories_team_idx" ON "calendar_categories" USING btree ("team_id");
    DO $$ BEGIN
      ALTER TABLE "calendar_categories" ADD CONSTRAINT "calendar_categories_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "lists" DROP COLUMN IF EXISTS "team_id";
    ALTER TABLE "calendar_categories" DROP COLUMN IF EXISTS "team_id";
    DROP TABLE IF EXISTS "team_members";
    DROP TABLE IF EXISTS "team_roles";
    DROP TABLE IF EXISTS "teams";
  `)
}
