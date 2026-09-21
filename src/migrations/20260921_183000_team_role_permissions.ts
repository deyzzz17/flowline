import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the 3 permission checkboxes to team_roles (see
// src/collections/TeamRoles.ts) — team roles started as a plain name-only
// label and are now used to gate the team's own action surface directly.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "team_roles" ADD COLUMN IF NOT EXISTS "can_manage_lists" boolean DEFAULT true;
    ALTER TABLE "team_roles" ADD COLUMN IF NOT EXISTS "can_manage_calendar" boolean DEFAULT true;
    ALTER TABLE "team_roles" ADD COLUMN IF NOT EXISTS "can_manage_members" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "team_roles" DROP COLUMN IF EXISTS "can_manage_lists";
    ALTER TABLE "team_roles" DROP COLUMN IF EXISTS "can_manage_calendar";
    ALTER TABLE "team_roles" DROP COLUMN IF EXISTS "can_manage_members";
  `)
}
