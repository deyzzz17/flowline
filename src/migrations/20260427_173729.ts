import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "timer_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" varchar NOT NULL,
  	"started_at" timestamp(3) with time zone NOT NULL,
  	"duration" numeric NOT NULL,
  	"category_name" varchar,
  	"category_color" varchar DEFAULT '#8b5cf6',
  	"sub_category" varchar,
  	"task_id" numeric,
  	"task_title" varchar,
  	"rating" numeric,
  	"task_completed" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "timer_sessions_id" integer;
  CREATE INDEX "timer_sessions_user_id_idx" ON "timer_sessions" USING btree ("user_id");
  CREATE INDEX "timer_sessions_started_at_idx" ON "timer_sessions" USING btree ("started_at");
  CREATE INDEX "timer_sessions_updated_at_idx" ON "timer_sessions" USING btree ("updated_at");
  CREATE INDEX "timer_sessions_created_at_idx" ON "timer_sessions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_timer_sessions_fk" FOREIGN KEY ("timer_sessions_id") REFERENCES "public"."timer_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_timer_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("timer_sessions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "timer_sessions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "timer_sessions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_timer_sessions_fk";
  
  DROP INDEX "payload_locked_documents_rels_timer_sessions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "timer_sessions_id";`)
}
