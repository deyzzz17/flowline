import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "task_comments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"task_id" integer NOT NULL,
  	"user_id" varchar NOT NULL,
  	"content" varchar NOT NULL,
  	"parent_comment_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "task_comments_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "task_comments_id" integer;
  ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_parent_comment_id_task_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."task_comments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "task_comments_texts" ADD CONSTRAINT "task_comments_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."task_comments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "task_comments_task_idx" ON "task_comments" USING btree ("task_id");
  CREATE INDEX "task_comments_user_id_idx" ON "task_comments" USING btree ("user_id");
  CREATE INDEX "task_comments_parent_comment_idx" ON "task_comments" USING btree ("parent_comment_id");
  CREATE INDEX "task_comments_updated_at_idx" ON "task_comments" USING btree ("updated_at");
  CREATE INDEX "task_comments_created_at_idx" ON "task_comments" USING btree ("created_at");
  CREATE INDEX "task_comments_texts_order_parent" ON "task_comments_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_task_comments_fk" FOREIGN KEY ("task_comments_id") REFERENCES "public"."task_comments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_task_comments_id_idx" ON "payload_locked_documents_rels" USING btree ("task_comments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "task_comments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "task_comments_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "task_comments" CASCADE;
  DROP TABLE "task_comments_texts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_task_comments_fk";
  
  DROP INDEX "payload_locked_documents_rels_task_comments_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "task_comments_id";`)
}
