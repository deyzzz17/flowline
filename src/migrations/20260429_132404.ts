import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "timer_sessions" ADD COLUMN "sub_category_color" varchar DEFAULT '#8b5cf6';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "timer_sessions" DROP COLUMN "sub_category_color";`)
}
