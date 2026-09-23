import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Reworks custom_roles from a single "base tier" select + 3 checkboxes into
// 7 fully independent checkboxes (see src/collections/CustomRoles.ts) —
// the Better-Auth-facing admin/member tier is now derived automatically
// from canManageMembers/canManageWorkspaceSettings instead of being a
// separate stored field.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "custom_roles" DROP COLUMN IF EXISTS "base_tier";
    DROP TYPE IF EXISTS "enum_custom_roles_base_tier";
    ALTER TABLE "custom_roles" ADD COLUMN IF NOT EXISTS "can_manage_workspace_settings" boolean DEFAULT false;
    ALTER TABLE "custom_roles" ADD COLUMN IF NOT EXISTS "can_manage_members" boolean DEFAULT false;
    ALTER TABLE "custom_roles" RENAME COLUMN "can_modify_content" TO "can_manage_lists";
    ALTER TABLE "custom_roles" ADD COLUMN IF NOT EXISTS "can_manage_calendar" boolean DEFAULT true;
    ALTER TABLE "custom_roles" ADD COLUMN IF NOT EXISTS "can_manage_teams" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_custom_roles_base_tier" AS ENUM('admin', 'member');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    ALTER TABLE "custom_roles" ADD COLUMN IF NOT EXISTS "base_tier" "enum_custom_roles_base_tier" DEFAULT 'member' NOT NULL;
    ALTER TABLE "custom_roles" DROP COLUMN IF EXISTS "can_manage_workspace_settings";
    ALTER TABLE "custom_roles" DROP COLUMN IF EXISTS "can_manage_members";
    ALTER TABLE "custom_roles" RENAME COLUMN "can_manage_lists" TO "can_modify_content";
    ALTER TABLE "custom_roles" DROP COLUMN IF EXISTS "can_manage_calendar";
    ALTER TABLE "custom_roles" DROP COLUMN IF EXISTS "can_manage_teams";
  `)
}
