import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_list_members_role" AS ENUM('editor', 'reader');
  CREATE TYPE "public"."enum_list_members_status" AS ENUM('pending', 'accepted');
  CREATE TABLE "list_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"list_id" integer NOT NULL,
  	"user_id" varchar NOT NULL,
  	"invited_by" varchar NOT NULL,
  	"role" "enum_list_members_role" DEFAULT 'editor' NOT NULL,
  	"status" "enum_list_members_status" DEFAULT 'pending' NOT NULL,
  	"responded_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "lists" ADD COLUMN "is_shared" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "list_members_id" integer;
  ALTER TABLE "list_members" ADD CONSTRAINT "list_members_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "list_members_list_idx" ON "list_members" USING btree ("list_id");
  CREATE INDEX "list_members_user_id_idx" ON "list_members" USING btree ("user_id");
  CREATE INDEX "list_members_status_idx" ON "list_members" USING btree ("status");
  CREATE INDEX "list_members_updated_at_idx" ON "list_members" USING btree ("updated_at");
  CREATE INDEX "list_members_created_at_idx" ON "list_members" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_list_members_fk" FOREIGN KEY ("list_members_id") REFERENCES "public"."list_members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lists_is_shared_idx" ON "lists" USING btree ("is_shared");
  CREATE INDEX "payload_locked_documents_rels_list_members_id_idx" ON "payload_locked_documents_rels" USING btree ("list_members_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "list_members" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "list_members" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_list_members_fk";
  
  DROP INDEX "lists_is_shared_idx";
  DROP INDEX "payload_locked_documents_rels_list_members_id_idx";
  ALTER TABLE "lists" DROP COLUMN "is_shared";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "list_members_id";
  DROP TYPE "public"."enum_list_members_role";
  DROP TYPE "public"."enum_list_members_status";`)
}
