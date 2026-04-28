import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "calendar_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"all_day" boolean DEFAULT false,
  	"color" varchar DEFAULT '#8b5cf6',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "calendar_events_id" integer;
  CREATE INDEX "calendar_events_user_id_idx" ON "calendar_events" USING btree ("user_id");
  CREATE INDEX "calendar_events_start_date_idx" ON "calendar_events" USING btree ("start_date");
  CREATE INDEX "calendar_events_updated_at_idx" ON "calendar_events" USING btree ("updated_at");
  CREATE INDEX "calendar_events_created_at_idx" ON "calendar_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_calendar_events_fk" FOREIGN KEY ("calendar_events_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_calendar_events_id_idx" ON "payload_locked_documents_rels" USING btree ("calendar_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "calendar_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "calendar_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_calendar_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_calendar_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "calendar_events_id";`)
}
