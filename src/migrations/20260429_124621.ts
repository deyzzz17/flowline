import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "timer_configs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"session_duration" numeric,
  	"work_duration" numeric,
  	"break_duration" numeric,
  	"category_name" varchar,
  	"category_color" varchar DEFAULT '#8b5cf6',
  	"sub_category" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "timer_configs_id" integer;
  CREATE INDEX "timer_configs_user_id_idx" ON "timer_configs" USING btree ("user_id");
  CREATE INDEX "timer_configs_updated_at_idx" ON "timer_configs" USING btree ("updated_at");
  CREATE INDEX "timer_configs_created_at_idx" ON "timer_configs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_timer_configs_fk" FOREIGN KEY ("timer_configs_id") REFERENCES "public"."timer_configs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_timer_configs_id_idx" ON "payload_locked_documents_rels" USING btree ("timer_configs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "timer_configs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "timer_configs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_timer_configs_fk";
  
  DROP INDEX "payload_locked_documents_rels_timer_configs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "timer_configs_id";`)
}
