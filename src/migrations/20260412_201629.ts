import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "lists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"user_id" varchar NOT NULL,
  	"category_name" varchar,
  	"category_color" varchar DEFAULT '#8b5cf6',
  	"is_default" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "tasks" ADD COLUMN "list_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lists_id" integer;
  CREATE INDEX "lists_user_id_idx" ON "lists" USING btree ("user_id");
  CREATE INDEX "lists_updated_at_idx" ON "lists" USING btree ("updated_at");
  CREATE INDEX "lists_created_at_idx" ON "lists" USING btree ("created_at");
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lists_fk" FOREIGN KEY ("lists_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tasks_list_idx" ON "tasks" USING btree ("list_id");
  CREATE INDEX "payload_locked_documents_rels_lists_id_idx" ON "payload_locked_documents_rels" USING btree ("lists_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lists" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "lists" CASCADE;
  ALTER TABLE "tasks" DROP CONSTRAINT "tasks_list_id_lists_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lists_fk";
  
  DROP INDEX "tasks_list_idx";
  DROP INDEX "payload_locked_documents_rels_lists_id_idx";
  ALTER TABLE "tasks" DROP COLUMN "list_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lists_id";`)
}
