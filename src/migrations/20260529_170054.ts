import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_habits_calendar_mode" AS ENUM('time', 'relative');
  CREATE TYPE "public"."enum_habits_relative_position" AS ENUM('before', 'after');
  ALTER TABLE "habits" ADD COLUMN "start_date" timestamp(3) with time zone;
  ALTER TABLE "habits" ADD COLUMN "show_in_calendar" boolean DEFAULT false;
  ALTER TABLE "habits" ADD COLUMN "calendar_mode" "enum_habits_calendar_mode";
  ALTER TABLE "habits" ADD COLUMN "habit_time" varchar;
  ALTER TABLE "habits" ADD COLUMN "habit_duration" numeric;
  ALTER TABLE "habits" ADD COLUMN "relative_position" "enum_habits_relative_position";
  ALTER TABLE "habits" ADD COLUMN "relative_event_id" numeric;
  ALTER TABLE "habits" ADD COLUMN "tracking_fields" jsonb;
  ALTER TABLE "habits" ADD COLUMN "goal" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "habits" DROP COLUMN "start_date";
  ALTER TABLE "habits" DROP COLUMN "show_in_calendar";
  ALTER TABLE "habits" DROP COLUMN "calendar_mode";
  ALTER TABLE "habits" DROP COLUMN "habit_time";
  ALTER TABLE "habits" DROP COLUMN "habit_duration";
  ALTER TABLE "habits" DROP COLUMN "relative_position";
  ALTER TABLE "habits" DROP COLUMN "relative_event_id";
  ALTER TABLE "habits" DROP COLUMN "tracking_fields";
  ALTER TABLE "habits" DROP COLUMN "goal";
  DROP TYPE "public"."enum_habits_calendar_mode";
  DROP TYPE "public"."enum_habits_relative_position";`)
}
