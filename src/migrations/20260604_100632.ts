import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_habits_frequency" ADD VALUE 'every_x_days' BEFORE 'times_per_week';
  ALTER TABLE "habits" ADD COLUMN "repeat_every_days" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "habits" ALTER COLUMN "frequency" SET DATA TYPE text;
  ALTER TABLE "habits" ALTER COLUMN "frequency" SET DEFAULT 'daily'::text;
  DROP TYPE "public"."enum_habits_frequency";
  CREATE TYPE "public"."enum_habits_frequency" AS ENUM('daily', 'days_of_week', 'times_per_week');
  ALTER TABLE "habits" ALTER COLUMN "frequency" SET DEFAULT 'daily'::"public"."enum_habits_frequency";
  ALTER TABLE "habits" ALTER COLUMN "frequency" SET DATA TYPE "public"."enum_habits_frequency" USING "frequency"::"public"."enum_habits_frequency";
  ALTER TABLE "habits" DROP COLUMN "repeat_every_days";`)
}
