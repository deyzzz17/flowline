'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { useCustomRoles, CUSTOM_ROLES_QUERY_KEY } from '@/hooks/workspace/use-custom-roles'
import { CustomRoleForm, type CustomRoleFormValue } from './custom-role-form'

interface CustomRolesPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomRolesPanel({ open, onOpenChange }: CustomRolesPanelProps) {
  const queryClient = useQueryClient()
  const { customRoles, isLoading } = useCustomRoles(open)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CustomRoleFormValue | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.customRoles.delete(id),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error deleting role')
        return
      }
      toast.info('Role deleted')
      queryClient.invalidateQueries({ queryKey: CUSTOM_ROLES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    },
    onError: () => toast.error('Error deleting role'),
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-violet-500" />
              Custom roles
            </DialogTitle>
            <DialogDescription>
              Roles you define for this workspace, on top of Admin/Editor/Viewer.
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400"
          >
            <Plus className="h-4 w-4" />
            New role
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
            </div>
          ) : customRoles.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground/60">
              No custom roles yet — create one above.
            </p>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {customRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{role.name}</p>
                    <p className="truncate text-xs text-muted-foreground/60">
                      Based on {role.baseTier === 'admin' ? 'Admin' : 'Editor'}
                      {role.canModifyContent ? '' : ' · Read-only'}
                      {role.canPermanentlyDeleteTasks ? ' · Can hard-delete tasks' : ''}
                      {role.canDeleteCalendarCategories ? ' · Can delete categories' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(role)
                      setFormOpen(true)
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        disabled={deleteMutation.isPending}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this role?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Anyone assigned <strong>{role.name}</strong> falls back to a plain{' '}
                          {role.baseTier === 'admin' ? 'Admin' : 'Editor'} role. This cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(role.id)}
                          variant="destructive"
                        >
                          Delete role
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CustomRoleForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </>
  )
}
