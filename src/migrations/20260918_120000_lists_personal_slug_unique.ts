import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Postgres treats every NULL as distinct in a unique index, so the
// (workspace, slug) index on Lists doesn't protect Personal lists
// (workspace IS NULL) from a colliding slug for the same user — e.g.
// "Todo" and "todo" both slugify to the same string and previously could
// both be created with no error, silently sharing one slug. This partial
// index restores that guarantee for Personal lists specifically, exactly
// as already documented in src/collections/Lists.ts.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "personal_list_user_slug_idx" ON "lists" ("user_id", "slug") WHERE "workspace" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "personal_list_user_slug_idx";
  `)
}
