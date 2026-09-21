'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { CUSTOM_ROLES_QUERY_KEY } from '@/hooks/workspace/use-custom-roles'
import type { CustomRoleBaseTier, CustomRoleInput } from '@/api/custom-roles/actions'

export interface CustomRoleFormValue {
  id: number
  name: string
  baseTier: CustomRoleBaseTier
  canModifyContent: boolean
  canPermanentlyDeleteTasks: boolean
  canDeleteCalendarCategories: boolean
}

interface CustomRoleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: CustomRoleFormValue | null
}

const DEFAULT_INPUT: CustomRoleInput = {
  name: '',
  baseTier: 'member',
  canModifyContent: true,
  canPermanentlyDeleteTasks: false,
  canDeleteCalendarCategories: false,
}

export function CustomRoleForm({ open, onOpenChange, editing }: CustomRoleFormProps) {
  const queryClient = useQueryClient()
  const [input, setInput] = useState<CustomRoleInput>(DEFAULT_INPUT)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setInput(
      editing
        ? {
            name: editing.name,
            baseTier: editing.baseTier,
            canModifyContent: editing.canModifyContent,
            canPermanentlyDeleteTasks: editing.canPermanentlyDeleteTasks,
            canDeleteCalendarCategories: editing.canDeleteCalendarCategories,
          }
        : DEFAULT_INPUT,
    )
  }, [open, editing])

  const mutation = useMutation({
    mutationFn: () =>
      editing ? api.customRoles.update(editing.id, input) : api.customRoles.create(input),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.info(editing ? 'Role updated' : 'Role created')
      queryClient.invalidateQueries({ queryKey: CUSTOM_ROLES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
      onOpenChange(false)
    },
    onError: () => setError('Something went wrong. Please try again.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.name.trim()) {
      setError('Name is required')
      return
    }
    setError(null)
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit role' : 'New custom role'}</DialogTitle>
          <DialogDescription>
            Give it a name, pick a base level, and choose what it&apos;s allowed to do.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="role-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role-name"
              value={input.name}
              onChange={(e) => setInput((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Content Lead"
              className="h-10"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Base level</Label>
            <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5">
              {(['member', 'admin'] as CustomRoleBaseTier[]).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setInput((prev) => ({ ...prev, baseTier: tier }))}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    input.baseTier === tier
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tier === 'admin' ? 'Admin' : 'Editor'}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/70">
              {input.baseTier === 'admin'
                ? 'Can invite/remove members and change roles, on top of the permissions below.'
                : "Can't invite/remove members or change roles — same as the built-in Editor for that."}
            </p>
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={input.canModifyContent}
                onCheckedChange={(v) =>
                  setInput((prev) => ({ ...prev, canModifyContent: v === true }))
                }
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium text-foreground">Modify content</span>
                <span className="block text-xs text-muted-foreground/70">
                  Create/edit lists, tasks, and calendar events. Off means read-only.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={input.canPermanentlyDeleteTasks}
                onCheckedChange={(v) =>
                  setInput((prev) => ({ ...prev, canPermanentlyDeleteTasks: v === true }))
                }
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium text-foreground">Permanently delete tasks</span>
                <span className="block text-xs text-muted-foreground/70">
                  Empty the trash for good, not just move tasks there.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={input.canDeleteCalendarCategories}
                onCheckedChange={(v) =>
                  setInput((prev) => ({ ...prev, canDeleteCalendarCategories: v === true }))
                }
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium text-foreground">Delete calendar categories</span>
                <span className="block text-xs text-muted-foreground/70">
                  Delete a category and its events.
                </span>
              </span>
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !input.name.trim()} className="gap-2">
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {editing ? 'Save changes' : 'Create role'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
