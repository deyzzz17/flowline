import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_task_completions_tags" AS ENUM('urgent', 'work', 'personal', 'health', 'finance', 'learning');
  CREATE TABLE "task_completions_tags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_task_completions_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "task_completions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" varchar NOT NULL,
  	"task_id" numeric NOT NULL,
  	"task_title" varchar NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"custom_tags_snapshot" jsonb,
  	"list_id" numeric,
  	"list_name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "task_completions_id" integer;
  ALTER TABLE "task_completions_tags" ADD CONSTRAINT "task_completions_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."task_completions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "task_completions_tags_order_idx" ON "task_completions_tags" USING btree ("order");
  CREATE INDEX "task_completions_tags_parent_idx" ON "task_completions_tags" USING btree ("parent_id");
  CREATE INDEX "task_completions_user_id_idx" ON "task_completions" USING btree ("user_id");
  CREATE INDEX "task_completions_task_id_idx" ON "task_completions" USING btree ("task_id");
  CREATE INDEX "task_completions_completed_at_idx" ON "task_completions" USING btree ("completed_at");
  CREATE INDEX "task_completions_list_id_idx" ON "task_completions" USING btree ("list_id");
  CREATE INDEX "task_completions_updated_at_idx" ON "task_completions" USING btree ("updated_at");
  CREATE INDEX "task_completions_created_at_idx" ON "task_completions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_task_completions_fk" FOREIGN KEY ("task_completions_id") REFERENCES "public"."task_completions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_task_completions_id_idx" ON "payload_locked_documents_rels" USING btree ("task_completions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "task_completions_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "task_completions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "task_completions_tags" CASCADE;
  DROP TABLE "task_completions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_task_completions_fk";
  
  DROP INDEX "payload_locked_documents_rels_task_completions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "task_completions_id";
  DROP TYPE "public"."enum_task_completions_tags";`)
}
