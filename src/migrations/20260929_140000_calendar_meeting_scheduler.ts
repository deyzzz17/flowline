import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Meeting scheduler for the Workspace Calendar:
// - calendar_events.show_as: how an event affects its people's availability
//   (free / tentative / busy / away), default busy;
// - calendar_events.teams (hasMany relationship → calendar_events_rels): a
//   scheduled meeting can be linked to several teams;
// - calendar_event_invitations: one row per invited participant with their
//   answer (pending / accepted / declined).
// Mirrors exactly what Payload's dev schema push created.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_calendar_events_show_as" AS ENUM('free', 'tentative', 'busy', 'away');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_calendar_event_invitations_status" AS ENUM('pending', 'accepted', 'declined');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "show_as" "enum_calendar_events_show_as" DEFAULT 'busy';

    CREATE TABLE IF NOT EXISTS "calendar_events_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "teams_id" integer
    );
    DO $$ BEGIN
      ALTER TABLE "calendar_events_rels" ADD CONSTRAINT "calendar_events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "calendar_events_rels" ADD CONSTRAINT "calendar_events_rels_teams_fk" FOREIGN KEY ("teams_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "calendar_events_rels_order_idx" ON "calendar_events_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "calendar_events_rels_parent_idx" ON "calendar_events_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "calendar_events_rels_path_idx" ON "calendar_events_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "calendar_events_rels_teams_id_idx" ON "calendar_events_rels" USING btree ("teams_id");

    CREATE TABLE IF NOT EXISTS "calendar_event_invitations" (
      "id" serial PRIMARY KEY NOT NULL,
      "event_id" integer NOT NULL,
      "user_id" varchar NOT NULL,
      "invited_by" varchar NOT NULL,
      "status" "enum_calendar_event_invitations_status" DEFAULT 'pending' NOT NULL,
      "responded_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    DO $$ BEGIN
      ALTER TABLE "calendar_event_invitations" ADD CONSTRAINT "calendar_event_invitations_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "calendar_event_invitations_event_idx" ON "calendar_event_invitations" USING btree ("event_id");
    CREATE INDEX IF NOT EXISTS "calendar_event_invitations_user_id_idx" ON "calendar_event_invitations" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "calendar_event_invitations_status_idx" ON "calendar_event_invitations" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "calendar_event_invitations_updated_at_idx" ON "calendar_event_invitations" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "calendar_event_invitations_created_at_idx" ON "calendar_event_invitations" USING btree ("created_at");

    -- Payload's document-locking table needs a column per collection (see
    -- 20260923_130000_lock_docs_rels_teams_custom_roles).
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "calendar_event_invitations_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_calendar_event_invitations_fk" FOREIGN KEY ("calendar_event_invitations_id") REFERENCES "public"."calendar_event_invitations"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_calendar_event_invitations_idx" ON "payload_locked_documents_rels" USING btree ("calendar_event_invitations_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "calendar_event_invitations_id";
    DROP TABLE IF EXISTS "calendar_event_invitations" CASCADE;
    DROP TABLE IF EXISTS "calendar_events_rels" CASCADE;
    ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "show_as";
    DROP TYPE IF EXISTS "public"."enum_calendar_event_invitations_status";
    DROP TYPE IF EXISTS "public"."enum_calendar_events_show_as";
  `)
}
