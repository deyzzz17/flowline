import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Events no longer have a free color: it's their calendar category's color,
// or gray (#9ca3af, NO_CATEGORY_EVENT_COLOR) without a category. Aligns the
// existing events and series adjustments with that rule. Custom colors on
// events without a category are lost — not reversible.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "calendar_events" e
      SET "color" = COALESCE(c."color", '#9ca3af')
      FROM "calendar_events" e2
      LEFT JOIN "calendar_categories" c ON c."id" = e2."category_id"
      WHERE e."id" = e2."id";

    UPDATE "calendar_events_adjustments" a
      SET "color" = c."color"
      FROM "calendar_categories" c
      WHERE a."category_id" = c."id";

    UPDATE "calendar_events_adjustments"
      SET "color" = NULL
      WHERE "category_id" IS NULL;

    ALTER TABLE "calendar_events" ALTER COLUMN "color" SET DEFAULT '#9ca3af';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "calendar_events" ALTER COLUMN "color" SET DEFAULT '#8b5cf6';
  `)
}
