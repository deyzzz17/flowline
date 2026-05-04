import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "calendar_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"color" varchar DEFAULT '#8b5cf6' NOT NULL,
  	"is_default" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "calendar_categories_id" integer;
  CREATE INDEX "calendar_categories_user_id_idx" ON "calendar_categories" USING btree ("user_id");
  CREATE INDEX "calendar_categories_updated_at_idx" ON "calendar_categories" USING btree ("updated_at");
  CREATE INDEX "calendar_categories_created_at_idx" ON "calendar_categories" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_calendar_categories_fk" FOREIGN KEY ("calendar_categories_id") REFERENCES "public"."calendar_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_calendar_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("calendar_categories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "calendar_categories" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "calendar_categories" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_calendar_categories_fk";
  
  DROP INDEX "payload_locked_documents_rels_calendar_categories_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "calendar_categories_id";`)
}
