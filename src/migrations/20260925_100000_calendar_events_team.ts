import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Calendar events can now optionally be scoped to a team — visible to that
// team's members instead of staying private to the creator, but only within
// the Workspace Calendar (the global, cross-workspace Calendar ignores it).
// Mirrors the same `team` relationship already on lists/calendar-categories.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "team_id" integer;

    DO $$ BEGIN
      ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "calendar_events_team_id_idx" ON "calendar_events" USING btree ("team_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "team_id";
  `)
}
