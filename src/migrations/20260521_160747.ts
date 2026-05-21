import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_calendar_events_source" AS ENUM('flowline', 'google');
  CREATE TYPE "public"."enum_google_calendar_syncs_status" AS ENUM('connected', 'disconnected', 'error');
  CREATE TABLE "google_calendar_syncs_calendars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"google_id" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"color" varchar,
  	"primary" boolean DEFAULT false,
  	"enabled" boolean DEFAULT true
  );
  
  CREATE TABLE "google_calendar_syncs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" varchar NOT NULL,
  	"next_sync_token" varchar,
  	"last_synced_at" timestamp(3) with time zone,
  	"status" "enum_google_calendar_syncs_status" DEFAULT 'connected',
  	"error_message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "calendar_events" ADD COLUMN "source" "enum_calendar_events_source" DEFAULT 'flowline';
  ALTER TABLE "calendar_events" ADD COLUMN "google_event_id" varchar;
  ALTER TABLE "calendar_events" ADD COLUMN "google_calendar_id" varchar;
  ALTER TABLE "calendar_events" ADD COLUMN "google_calendar_name" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "google_calendar_syncs_id" integer;
  ALTER TABLE "google_calendar_syncs_calendars" ADD CONSTRAINT "google_calendar_syncs_calendars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."google_calendar_syncs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "google_calendar_syncs_calendars_order_idx" ON "google_calendar_syncs_calendars" USING btree ("_order");
  CREATE INDEX "google_calendar_syncs_calendars_parent_id_idx" ON "google_calendar_syncs_calendars" USING btree ("_parent_id");
  CREATE INDEX "google_calendar_syncs_user_id_idx" ON "google_calendar_syncs" USING btree ("user_id");
  CREATE INDEX "google_calendar_syncs_updated_at_idx" ON "google_calendar_syncs" USING btree ("updated_at");
  CREATE INDEX "google_calendar_syncs_created_at_idx" ON "google_calendar_syncs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_google_calendar_syncs_fk" FOREIGN KEY ("google_calendar_syncs_id") REFERENCES "public"."google_calendar_syncs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "calendar_events_google_event_id_idx" ON "calendar_events" USING btree ("google_event_id");
  CREATE INDEX "payload_locked_documents_rels_google_calendar_syncs_id_idx" ON "payload_locked_documents_rels" USING btree ("google_calendar_syncs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "google_calendar_syncs_calendars" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "google_calendar_syncs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "google_calendar_syncs_calendars" CASCADE;
  DROP TABLE "google_calendar_syncs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_google_calendar_syncs_fk";
  
  DROP INDEX "calendar_events_google_event_id_idx";
  DROP INDEX "payload_locked_documents_rels_google_calendar_syncs_id_idx";
  ALTER TABLE "calendar_events" DROP COLUMN "source";
  ALTER TABLE "calendar_events" DROP COLUMN "google_event_id";
  ALTER TABLE "calendar_events" DROP COLUMN "google_calendar_id";
  ALTER TABLE "calendar_events" DROP COLUMN "google_calendar_name";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "google_calendar_syncs_id";
  DROP TYPE "public"."enum_calendar_events_source";
  DROP TYPE "public"."enum_google_calendar_syncs_status";`)
}
