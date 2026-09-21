'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db-pool'
import { ok, err } from '@/types/result'
import { getSession } from '@/lib/get-session'
import { getWorkspaceRoleForUser } from '@/lib/get-current-workspace'
import type { CustomRole } from '@/payload-types'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

const getActiveWorkspaceId = async () => {
  const session = await getSession()
  return session?.session.activeOrganizationId ?? null
}

export type CustomRoleBaseTier = 'admin' | 'member'

export interface CustomRoleInput {
  name: string
  baseTier: CustomRoleBaseTier
  canModifyContent: boolean
  canPermanentlyDeleteTasks: boolean
  canDeleteCalendarCategories: boolean
}

function toDoc(d: CustomRole) {
  return {
    id: d.id,
    name: d.name,
    baseTier: d.baseTier,
    canModifyContent: !!d.canModifyContent,
    canPermanentlyDeleteTasks: !!d.canPermanentlyDeleteTasks,
    canDeleteCalendarCategories: !!d.canDeleteCalendarCategories,
  }
}

// Any actual member of the workspace can see the roster of custom roles —
// needed so the role picker can offer them when assigning a member. Only
// owner/admin may create, edit, or delete one.
export const listCustomRoles = async () => {
  const userId = await getUserId()
  if (!userId) return []
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return []
  const role = await getWorkspaceRoleForUser(workspaceId, userId)
  if (!role) return []

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'custom-roles',
    where: { workspace: { equals: workspaceId } },
    sort: 'name',
    limit: 0,
  })
  return docs.map(toDoc)
}

async function assertCanManageRoles(workspaceId: string, userId: string) {
  const role = await getWorkspaceRoleForUser(workspaceId, userId)
  return role === 'owner' || role === 'admin'
}

export const createCustomRole = async (input: CustomRoleInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return err('No active workspace')
    if (!(await assertCanManageRoles(workspaceId, userId))) return err('Not authorized')

    const name = input.name.trim()
    if (!name) return err('Name is required')

    const payload = await getPayload({ config })
    const { totalDocs: existing } = await payload.find({
      collection: 'custom-roles',
      where: { and: [{ workspace: { equals: workspaceId } }, { name: { equals: name } }] },
      limit: 0,
    })
    if (existing > 0) return err('A role with this name already exists')

    const created = await payload.create({
      collection: 'custom-roles',
      data: {
        workspace: workspaceId,
        name,
        baseTier: input.baseTier,
        canModifyContent: input.canModifyContent,
        canPermanentlyDeleteTasks: input.canPermanentlyDeleteTasks,
        canDeleteCalendarCategories: input.canDeleteCalendarCategories,
      },
    })

    revalidatePath('/')
    return ok(toDoc(created))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error creating role'
    return err(message)
  }
}

export const updateCustomRole = async (id: number, input: CustomRoleInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return err('No active workspace')
    if (!(await assertCanManageRoles(workspaceId, userId))) return err('Not authorized')

    const payload = await getPayload({ config })
    const existing = await payload.findByID({ collection: 'custom-roles', id }).catch(() => null)
    if (!existing || existing.workspace !== workspaceId) return err('Role not found')

    const name = input.name.trim()
    if (!name) return err('Name is required')

    const { totalDocs: dupeCount } = await payload.find({
      collection: 'custom-roles',
      where: {
        and: [
          { workspace: { equals: workspaceId } },
          { name: { equals: name } },
          { id: { not_equals: id } },
        ],
      },
      limit: 0,
    })
    if (dupeCount > 0) return err('A role with this name already exists')

    const updated = await payload.update({
      collection: 'custom-roles',
      id,
      data: {
        name,
        baseTier: input.baseTier,
        canModifyContent: input.canModifyContent,
        canPermanentlyDeleteTasks: input.canPermanentlyDeleteTasks,
        canDeleteCalendarCategories: input.canDeleteCalendarCategories,
      },
    })

    // Members currently on this role need their Better Auth `role` mirror
    // updated too if the base tier changed — that's the value Better Auth's
    // own invite/remove/role-change endpoints actually check.
    await pool.query(`UPDATE member SET role = $1 WHERE "customRoleId" = $2`, [
      input.baseTier,
      String(id),
    ])

    revalidatePath('/')
    return ok(toDoc(updated))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error updating role'
    return err(message)
  }
}

export const deleteCustomRole = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return err('No active workspace')
    if (!(await assertCanManageRoles(workspaceId, userId))) return err('Not authorized')

    const payload = await getPayload({ config })
    const existing = await payload.findByID({ collection: 'custom-roles', id }).catch(() => null)
    if (!existing || existing.workspace !== workspaceId) return err('Role not found')

    // Anyone still assigned this role falls back to its plain base tier —
    // `role` on their member row was already kept in sync, so only the
    // pointer back to this (now-deleted) role needs clearing.
    await pool.query(`UPDATE member SET "customRoleId" = NULL WHERE "customRoleId" = $1`, [
      String(id),
    ])

    await payload.delete({ collection: 'custom-roles', id })

    revalidatePath('/')
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error deleting role'
    return err(message)
  }
}
