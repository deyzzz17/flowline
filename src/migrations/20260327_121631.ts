import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tasks_subtasks_tags" AS ENUM('urgent', 'work', 'personal', 'health', 'finance', 'learning');
  CREATE TABLE "tasks_subtasks_tags" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_tasks_subtasks_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "user_tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"color" varchar NOT NULL,
  	"user_id" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "tasks" ALTER COLUMN "recurrence_frequency" DROP DEFAULT;
  ALTER TABLE "tasks_subtasks" ADD COLUMN "description" varchar;
  ALTER TABLE "tasks_subtasks" ADD COLUMN "due_date" timestamp(3) with time zone;
  ALTER TABLE "tasks" ADD COLUMN "due_date" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "user_tags_id" integer;
  ALTER TABLE "tasks_subtasks_tags" ADD CONSTRAINT "tasks_subtasks_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks_subtasks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tasks_subtasks_tags_order_idx" ON "tasks_subtasks_tags" USING btree ("order");
  CREATE INDEX "tasks_subtasks_tags_parent_idx" ON "tasks_subtasks_tags" USING btree ("parent_id");
  CREATE INDEX "user_tags_user_id_idx" ON "user_tags" USING btree ("user_id");
  CREATE INDEX "user_tags_updated_at_idx" ON "user_tags" USING btree ("updated_at");
  CREATE INDEX "user_tags_created_at_idx" ON "user_tags" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_tags_fk" FOREIGN KEY ("user_tags_id") REFERENCES "public"."user_tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_user_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("user_tags_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tasks_subtasks_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "user_tags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tasks_subtasks_tags" CASCADE;
  DROP TABLE "user_tags" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_user_tags_fk";
  
  DROP INDEX "payload_locked_documents_rels_user_tags_id_idx";
  ALTER TABLE "tasks" ALTER COLUMN "recurrence_frequency" SET DEFAULT 'daily';
  ALTER TABLE "tasks_subtasks" DROP COLUMN "description";
  ALTER TABLE "tasks_subtasks" DROP COLUMN "due_date";
  ALTER TABLE "tasks" DROP COLUMN "due_date";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "user_tags_id";
  DROP TYPE "public"."enum_tasks_subtasks_tags";`)
}
