'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronRight, Loader2, Plus, Trash2, Pencil, X } from 'lucide-react'
import { api } from '@/api'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  TeamRolePermissionsFields,
  TEAM_ROLE_PERMISSION_FIELDS,
  type TeamRolePermissionsValue,
} from './team-role-permissions-fields'
import type { TeamRole, TeamRoleInput } from '@/api/teams/actions'

interface TeamRolesEditorProps {
  teamId: number
  /** Whether the current user can create/edit/delete this team's roles. */
  canManage: boolean
}

// Shared between the team's own Members tab and the sidebar's "Edit team"
// dialog — one source of truth for the roles view/edit UX (view-only list
// of what a role allows, pencil to edit name + checkboxes together, staged
// locally until Save).
export function TeamRolesEditor({ teamId, canManage }: TeamRolesEditorProps) {
  const queryClient = useQueryClient()
  const rolesKey = ['teams', teamId, 'roles']
  const overviewKey = ['teams', teamId, 'overview']
  const { data: rolesData } = useQuery({
    queryKey: rolesKey,
    queryFn: () => api.teams.listRoles(teamId),
  })
  const roles = rolesData ?? []

  const [newRoleName, setNewRoleName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null)
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)
  const [roleNameDraft, setRoleNameDraft] = useState('')
  const [permissionsDraft, setPermissionsDraft] = useState<TeamRolePermissionsValue | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: rolesKey })
    // Role names show up on member rows in the overview too.
    queryClient.invalidateQueries({ queryKey: overviewKey })
  }

  const createRoleMutation = useMutation({
    mutationFn: (name: string) =>
      api.teams.createRole(teamId, {
        name,
        canManageLists: true,
        canManageCalendar: true,
        canManageMembers: false,
        canManageTeamSettings: false,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.error)
        return
      }
      setError(null)
      setNewRoleName('')
      invalidate()
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, input }: { roleId: number; input: TeamRoleInput }) =>
      api.teams.updateRole(teamId, roleId, input),
    // Applied to the cache immediately so the save feels instant, rolled
    // back if the request actually fails.
    onMutate: async ({ roleId, input }) => {
      await queryClient.cancelQueries({ queryKey: rolesKey })
      const previous = queryClient.getQueryData<TeamRole[]>(rolesKey)
      queryClient.setQueryData<TeamRole[]>(rolesKey, (old) =>
        old?.map((r) => (r.id === roleId ? { ...r, ...input } : r)),
      )
      return { previous }
    },
    onSuccess: (result, { roleId }) => {
      if (!result.ok) {
        toast.error(result.error || 'Error updating role')
        return
      }
      if (editingRoleId === roleId) {
        setEditingRoleId(null)
        setPermissionsDraft(null)
      }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(rolesKey, context.previous)
      toast.error('Error updating role')
    },
    onSettled: () => invalidate(),
  })

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) => api.teams.deleteRole(teamId, roleId),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error deleting role')
        return
      }
      toast.info('Role deleted')
      invalidate()
    },
  })

  const startEditingRole = (role: TeamRole) => {
    setEditingRoleId(role.id)
    setRoleNameDraft(role.name)
    setPermissionsDraft({
      canManageLists: role.canManageLists,
      canManageCalendar: role.canManageCalendar,
      canManageMembers: role.canManageMembers,
      canManageTeamSettings: role.canManageTeamSettings,
    })
    setExpandedRoleId(role.id)
  }

  const cancelEditingRole = () => {
    setEditingRoleId(null)
    setPermissionsDraft(null)
  }

  const saveRole = (role: TeamRole) => {
    const name = roleNameDraft.trim()
    if (!name) return
    const permissions = permissionsDraft ?? role
    updateRoleMutation.mutate({ roleId: role.id, input: { name, ...permissions } })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Roles</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Tap a role to see what it&apos;s allowed to do — use the pencil to change it.
        </p>
      </div>

      <div className="space-y-1.5">
        {roles.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground/60">No roles yet.</p>
        ) : (
          roles.map((role) => {
            const isExpanded = expandedRoleId === role.id
            const isEditingName = editingRoleId === role.id
            return (
              <div key={role.id} className="rounded-2xl bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground"
                  >
                    <ChevronRight
                      className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')}
                    />
                  </button>
                  {isEditingName ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveRole(role)
                      }}
                      className="flex flex-1 items-center gap-1.5"
                    >
                      <Input
                        autoFocus
                        value={roleNameDraft}
                        onChange={(e) => setRoleNameDraft(e.target.value)}
                        className="h-7 flex-1 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={!roleNameDraft.trim() || updateRoleMutation.isPending}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-violet-600 transition-colors hover:bg-violet-500/10 disabled:opacity-50"
                      >
                        {updateRoleMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingRole}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm font-medium text-foreground">
                        {role.name}
                      </span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => startEditingRole(role)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canManage && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this role?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Members using <strong>{role.name}</strong> must be reassigned to
                                another role first.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteRoleMutation.mutate(role.id)}
                                variant="destructive"
                              >
                                Delete role
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </>
                  )}
                </div>
                {isExpanded && (
                  <div className="border-t border-border/30 bg-muted/20 px-4 py-3">
                    {isEditingName ? (
                      <TeamRolePermissionsFields
                        value={permissionsDraft ?? role}
                        onChange={setPermissionsDraft}
                      />
                    ) : (
                      (() => {
                        const allowed = TEAM_ROLE_PERMISSION_FIELDS.filter(
                          (field) => role[field.key],
                        )
                        return allowed.length === 0 ? (
                          <p className="text-xs text-muted-foreground/60">
                            No permissions granted.
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {allowed.map((field) => (
                              <li
                                key={field.key}
                                className="flex items-center gap-2 text-xs text-foreground"
                              >
                                <Check className="h-3 w-3 shrink-0 text-violet-500" />
                                {field.label}
                              </li>
                            ))}
                          </ul>
                        )
                      })()
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {canManage && (
        <div className="space-y-2">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex items-center gap-2">
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (newRoleName.trim()) createRoleMutation.mutate(newRoleName.trim())
                }
              }}
              placeholder="New role name..."
              className="h-9 text-sm"
            />
            <button
              type="button"
              onClick={() => newRoleName.trim() && createRoleMutation.mutate(newRoleName.trim())}
              disabled={!newRoleName.trim() || createRoleMutation.isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              {createRoleMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
