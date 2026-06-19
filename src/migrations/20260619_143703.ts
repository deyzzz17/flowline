import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_connections_status" AS ENUM('pending', 'accepted');
  CREATE TABLE "connections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"requester_id" varchar NOT NULL,
  	"recipient_id" varchar NOT NULL,
  	"status" "enum_connections_status" DEFAULT 'pending' NOT NULL,
  	"responded_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "connections_id" integer;
  CREATE INDEX "connections_requester_id_idx" ON "connections" USING btree ("requester_id");
  CREATE INDEX "connections_recipient_id_idx" ON "connections" USING btree ("recipient_id");
  CREATE INDEX "connections_status_idx" ON "connections" USING btree ("status");
  CREATE INDEX "connections_updated_at_idx" ON "connections" USING btree ("updated_at");
  CREATE INDEX "connections_created_at_idx" ON "connections" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_connections_fk" FOREIGN KEY ("connections_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_connections_id_idx" ON "payload_locked_documents_rels" USING btree ("connections_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "connections" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "connections" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_connections_fk";
  
  DROP INDEX "payload_locked_documents_rels_connections_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "connections_id";
  DROP TYPE "public"."enum_connections_status";`)
}
