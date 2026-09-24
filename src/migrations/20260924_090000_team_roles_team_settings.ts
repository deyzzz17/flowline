import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Team roles previously only covered lists/calendar/members — nothing gated
// renaming or deleting the team itself, so that ended up bolted onto
// canManageMembers as a stand-in. This adds its own checkbox instead.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "team_roles" ADD COLUMN IF NOT EXISTS "can_manage_team_settings" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "team_roles" DROP COLUMN IF EXISTS "can_manage_team_settings";
  `)
}
