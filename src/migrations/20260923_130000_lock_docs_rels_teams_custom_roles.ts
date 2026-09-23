import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// `payload_locked_documents_rels` is Payload's shared polymorphic table
// backing document locking — it needs one nullable FK column per collection.
// Local dev's auto schema-push added these silently when the custom-roles/
// teams/team-roles/team-members collections were first created, but that
// push never ran against the deployed DB, so every update to one of those
// collections failed in production/preview: Payload's own lock-check query
// referenced columns that didn't exist there.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "custom_roles_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "teams_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "team_roles_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "team_members_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_custom_roles_fk" FOREIGN KEY ("custom_roles_id") REFERENCES "custom_roles"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teams_fk" FOREIGN KEY ("teams_id") REFERENCES "teams"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_roles_fk" FOREIGN KEY ("team_roles_id") REFERENCES "team_roles"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "team_members"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_custom_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("custom_roles_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_teams_id_idx" ON "payload_locked_documents_rels" USING btree ("teams_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_team_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("team_roles_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "custom_roles_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "teams_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "team_roles_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "team_members_id";
  `)
}
