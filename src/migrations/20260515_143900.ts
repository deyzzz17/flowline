import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_calendar_events_recurrence_days_of_week" AS ENUM('0', '1', '2', '3', '4', '5', '6');
  CREATE TYPE "public"."enum_calendar_events_recurrence_frequency" AS ENUM('daily', 'weekly', 'monthly', 'yearly');
  CREATE TYPE "public"."enum_calendar_events_recurrence_monthly_type" AS ENUM('dayOfMonth', 'dayOfWeek');
  CREATE TYPE "public"."enum_calendar_events_recurrence_end_type" AS ENUM('never', 'onDate', 'afterCount');
  CREATE TABLE "calendar_events_recurrence_days_of_week" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_calendar_events_recurrence_days_of_week",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "calendar_events_exceptions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL
  );
  
  ALTER TABLE "calendar_events" ADD COLUMN "recurrence_frequency" "enum_calendar_events_recurrence_frequency";
  ALTER TABLE "calendar_events" ADD COLUMN "recurrence_interval" numeric DEFAULT 1;
  ALTER TABLE "calendar_events" ADD COLUMN "recurrence_monthly_type" "enum_calendar_events_recurrence_monthly_type";
  ALTER TABLE "calendar_events" ADD COLUMN "recurrence_end_type" "enum_calendar_events_recurrence_end_type" DEFAULT 'never';
  ALTER TABLE "calendar_events" ADD COLUMN "recurrence_end_date" timestamp(3) with time zone;
  ALTER TABLE "calendar_events" ADD COLUMN "recurrence_end_count" numeric;
  ALTER TABLE "calendar_events" ADD COLUMN "recurrence_id" numeric;
  ALTER TABLE "calendar_events" ADD COLUMN "original_date" timestamp(3) with time zone;
  ALTER TABLE "calendar_events_recurrence_days_of_week" ADD CONSTRAINT "calendar_events_recurrence_days_of_week_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "calendar_events_exceptions" ADD CONSTRAINT "calendar_events_exceptions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "calendar_events_recurrence_days_of_week_order_idx" ON "calendar_events_recurrence_days_of_week" USING btree ("order");
  CREATE INDEX "calendar_events_recurrence_days_of_week_parent_idx" ON "calendar_events_recurrence_days_of_week" USING btree ("parent_id");
  CREATE INDEX "calendar_events_exceptions_order_idx" ON "calendar_events_exceptions" USING btree ("_order");
  CREATE INDEX "calendar_events_exceptions_parent_id_idx" ON "calendar_events_exceptions" USING btree ("_parent_id");
  CREATE INDEX "calendar_events_recurrence_id_idx" ON "calendar_events" USING btree ("recurrence_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "calendar_events_recurrence_days_of_week" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "calendar_events_exceptions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "calendar_events_recurrence_days_of_week" CASCADE;
  DROP TABLE "calendar_events_exceptions" CASCADE;
  DROP INDEX "calendar_events_recurrence_id_idx";
  ALTER TABLE "calendar_events" DROP COLUMN "recurrence_frequency";
  ALTER TABLE "calendar_events" DROP COLUMN "recurrence_interval";
  ALTER TABLE "calendar_events" DROP COLUMN "recurrence_monthly_type";
  ALTER TABLE "calendar_events" DROP COLUMN "recurrence_end_type";
  ALTER TABLE "calendar_events" DROP COLUMN "recurrence_end_date";
  ALTER TABLE "calendar_events" DROP COLUMN "recurrence_end_count";
  ALTER TABLE "calendar_events" DROP COLUMN "recurrence_id";
  ALTER TABLE "calendar_events" DROP COLUMN "original_date";
  DROP TYPE "public"."enum_calendar_events_recurrence_days_of_week";
  DROP TYPE "public"."enum_calendar_events_recurrence_frequency";
  DROP TYPE "public"."enum_calendar_events_recurrence_monthly_type";
  DROP TYPE "public"."enum_calendar_events_recurrence_end_type";`)
}
