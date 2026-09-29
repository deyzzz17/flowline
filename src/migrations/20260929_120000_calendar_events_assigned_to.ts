import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Calendar events can be assigned to workspace members (`assignedTo`, a
// hasMany text field of userIds — stored like tasks.assignedTo in a
// `<collection>_texts` table). An assigned event shows up in each assignee's
// own agenda in the Workspace Calendar.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "calendar_events_texts" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "text" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "calendar_events_texts" ADD CONSTRAINT "calendar_events_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "calendar_events_texts_order_parent" ON "calendar_events_texts" USING btree ("order","parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "calendar_events_texts" CASCADE;
  `)
}
