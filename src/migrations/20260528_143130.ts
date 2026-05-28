import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_habits_days_of_week" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
  CREATE TYPE "public"."enum_habits_frequency" AS ENUM('daily', 'days_of_week', 'times_per_week');
  CREATE TABLE "habits_days_of_week" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_habits_days_of_week",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "habits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"color" varchar DEFAULT '#8b5cf6',
  	"category_tag" varchar,
  	"frequency" "enum_habits_frequency" DEFAULT 'daily' NOT NULL,
  	"times_per_week" numeric,
  	"archived_at" timestamp(3) with time zone,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "habit_completions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" varchar NOT NULL,
  	"habit_id" numeric NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "habits_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "habit_completions_id" integer;
  ALTER TABLE "habits_days_of_week" ADD CONSTRAINT "habits_days_of_week_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "habits_days_of_week_order_idx" ON "habits_days_of_week" USING btree ("order");
  CREATE INDEX "habits_days_of_week_parent_idx" ON "habits_days_of_week" USING btree ("parent_id");
  CREATE INDEX "habits_user_id_idx" ON "habits" USING btree ("user_id");
  CREATE INDEX "habits_updated_at_idx" ON "habits" USING btree ("updated_at");
  CREATE INDEX "habits_created_at_idx" ON "habits" USING btree ("created_at");
  CREATE INDEX "habit_completions_user_id_idx" ON "habit_completions" USING btree ("user_id");
  CREATE INDEX "habit_completions_habit_id_idx" ON "habit_completions" USING btree ("habit_id");
  CREATE INDEX "habit_completions_completed_at_idx" ON "habit_completions" USING btree ("completed_at");
  CREATE INDEX "habit_completions_updated_at_idx" ON "habit_completions" USING btree ("updated_at");
  CREATE INDEX "habit_completions_created_at_idx" ON "habit_completions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_habits_fk" FOREIGN KEY ("habits_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_habit_completions_fk" FOREIGN KEY ("habit_completions_id") REFERENCES "public"."habit_completions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_habits_id_idx" ON "payload_locked_documents_rels" USING btree ("habits_id");
  CREATE INDEX "payload_locked_documents_rels_habit_completions_id_idx" ON "payload_locked_documents_rels" USING btree ("habit_completions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "habits_days_of_week" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "habits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "habit_completions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "habits_days_of_week" CASCADE;
  DROP TABLE "habits" CASCADE;
  DROP TABLE "habit_completions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_habits_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_habit_completions_fk";
  
  DROP INDEX "payload_locked_documents_rels_habits_id_idx";
  DROP INDEX "payload_locked_documents_rels_habit_completions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "habits_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "habit_completions_id";
  DROP TYPE "public"."enum_habits_days_of_week";
  DROP TYPE "public"."enum_habits_frequency";`)
}
