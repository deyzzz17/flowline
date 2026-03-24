import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tasks_tags" CASCADE;
  DROP TABLE "tasks_subtasks" CASCADE;
  DROP TABLE "tasks_recurrence_days" CASCADE;
  ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'active'::text;
  DROP TYPE "public"."enum_tasks_status";
  CREATE TYPE "public"."enum_tasks_status" AS ENUM('active', 'completed', 'deleted');
  ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."enum_tasks_status";
  ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE "public"."enum_tasks_status" USING "status"::"public"."enum_tasks_status";
  ALTER TABLE "tasks" DROP COLUMN "type";
  ALTER TABLE "tasks" DROP COLUMN "recurrence_frequency";
  DROP TYPE "public"."enum_tasks_tags";
  DROP TYPE "public"."enum_tasks_recurrence_days";
  DROP TYPE "public"."enum_tasks_type";
  DROP TYPE "public"."enum_tasks_recurrence_frequency";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tasks_tags" AS ENUM('urgent', 'work', 'personal', 'health', 'finance', 'learning');
  CREATE TYPE "public"."enum_tasks_recurrence_days" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
  CREATE TYPE "public"."enum_tasks_type" AS ENUM('simple', 'recurring');
  CREATE TYPE "public"."enum_tasks_recurrence_frequency" AS ENUM('daily', 'custom');
  ALTER TYPE "public"."enum_tasks_status" ADD VALUE 'inactive';
  CREATE TABLE "tasks_tags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_tasks_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "tasks_subtasks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"done" boolean DEFAULT false
  );
  
  CREATE TABLE "tasks_recurrence_days" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_tasks_recurrence_days",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "tasks" ADD COLUMN "type" "enum_tasks_type" DEFAULT 'simple' NOT NULL;
  ALTER TABLE "tasks" ADD COLUMN "recurrence_frequency" "enum_tasks_recurrence_frequency" DEFAULT 'daily';
  ALTER TABLE "tasks_tags" ADD CONSTRAINT "tasks_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tasks_subtasks" ADD CONSTRAINT "tasks_subtasks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tasks_recurrence_days" ADD CONSTRAINT "tasks_recurrence_days_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tasks_tags_order_idx" ON "tasks_tags" USING btree ("order");
  CREATE INDEX "tasks_tags_parent_idx" ON "tasks_tags" USING btree ("parent_id");
  CREATE INDEX "tasks_subtasks_order_idx" ON "tasks_subtasks" USING btree ("_order");
  CREATE INDEX "tasks_subtasks_parent_id_idx" ON "tasks_subtasks" USING btree ("_parent_id");
  CREATE INDEX "tasks_recurrence_days_order_idx" ON "tasks_recurrence_days" USING btree ("order");
  CREATE INDEX "tasks_recurrence_days_parent_idx" ON "tasks_recurrence_days" USING btree ("parent_id");`)
}
