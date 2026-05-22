import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "calendar_events_google_event_id_idx";
  ALTER TABLE "calendar_events" DROP COLUMN "source";
  ALTER TABLE "calendar_events" DROP COLUMN "google_event_id";
  ALTER TABLE "calendar_events" DROP COLUMN "google_calendar_id";
  ALTER TABLE "calendar_events" DROP COLUMN "google_calendar_name";
  DROP TYPE "public"."enum_calendar_events_source";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_calendar_events_source" AS ENUM('flowline', 'google');
  ALTER TABLE "calendar_events" ADD COLUMN "source" "enum_calendar_events_source" DEFAULT 'flowline';
  ALTER TABLE "calendar_events" ADD COLUMN "google_event_id" varchar;
  ALTER TABLE "calendar_events" ADD COLUMN "google_calendar_id" varchar;
  ALTER TABLE "calendar_events" ADD COLUMN "google_calendar_name" varchar;
  CREATE INDEX "calendar_events_google_event_id_idx" ON "calendar_events" USING btree ("google_event_id");`)
}
