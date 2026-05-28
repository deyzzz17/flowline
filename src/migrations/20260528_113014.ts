import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "calendar_events_adjustments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from_date" timestamp(3) with time zone NOT NULL,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"title" varchar,
  	"description" varchar,
  	"color" varchar,
  	"category_id" numeric,
  	"all_day" boolean
  );
  
  ALTER TABLE "calendar_events_adjustments" ADD CONSTRAINT "calendar_events_adjustments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "calendar_events_adjustments_order_idx" ON "calendar_events_adjustments" USING btree ("_order");
  CREATE INDEX "calendar_events_adjustments_parent_id_idx" ON "calendar_events_adjustments" USING btree ("_parent_id");
  ALTER TABLE "calendar_events" DROP COLUMN "series_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "calendar_events_adjustments" CASCADE;
  ALTER TABLE "calendar_events" ADD COLUMN "series_id" varchar;`)
}
