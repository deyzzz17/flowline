import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Meetings (created with the meeting scheduler) are flagged so they can only
// be changed through the scheduler again; existing ones are the events that
// have invitations. Invitations remember the last change of their meeting,
// to notify the participant.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "is_meeting" boolean DEFAULT false;
    CREATE INDEX IF NOT EXISTS "calendar_events_is_meeting_idx" ON "calendar_events" USING btree ("is_meeting");
    UPDATE "calendar_events" e SET "is_meeting" = true
      WHERE EXISTS (SELECT 1 FROM "calendar_event_invitations" i WHERE i."event_id" = e."id");

    ALTER TABLE "calendar_event_invitations" ADD COLUMN IF NOT EXISTS "changed_at" timestamp(3) with time zone;
    ALTER TABLE "calendar_event_invitations" ADD COLUMN IF NOT EXISTS "change_summary" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "calendar_events_is_meeting_idx";
    ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "is_meeting";
    ALTER TABLE "calendar_event_invitations" DROP COLUMN IF EXISTS "changed_at";
    ALTER TABLE "calendar_event_invitations" DROP COLUMN IF EXISTS "change_summary";
  `)
}
