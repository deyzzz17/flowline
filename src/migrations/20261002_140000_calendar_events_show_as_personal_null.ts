import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The availability status (show_as) only matters for workspace events (meeting
// scheduler). It no longer has a column default: the server sets 'busy' for
// workspace events unless chosen, and leaves Personal events (no workspace)
// without one.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "calendar_events" ALTER COLUMN "show_as" DROP DEFAULT;
    UPDATE "calendar_events" SET "show_as" = NULL WHERE "workspace" IS NULL;
    UPDATE "calendar_events" SET "show_as" = 'busy' WHERE "workspace" IS NOT NULL AND "show_as" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "calendar_events" ALTER COLUMN "show_as" SET DEFAULT 'busy';
    UPDATE "calendar_events" SET "show_as" = 'busy' WHERE "show_as" IS NULL;
  `)
}
