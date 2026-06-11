import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "habits" ADD COLUMN "archived_longest_streak" numeric;
  ALTER TABLE "habits" ADD COLUMN "archived_total_completions" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "habits" DROP COLUMN "archived_longest_streak";
  ALTER TABLE "habits" DROP COLUMN "archived_total_completions";`)
}
