'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'
import { api } from '@/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TeamRolesEditor } from './team-roles-editor'
import { TEAMS_QUERY_KEY } from '@/hooks/teams/use-teams'

interface EditTeamDialogProps {
  teamId: number
  /** Shown immediately while the dialog's own fetch is in flight. */
  teamName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Reachable both from the sidebar's "..." menu on a team, and from the
// pencil icon on the team's own page — one form covering both renaming the
// team and managing its roles, so editing a team is never just the name.
export function EditTeamDialog({ teamId, teamName, open, onOpenChange }: EditTeamDialogProps) {
  const queryClient = useQueryClient()
  const overviewKey = ['teams', teamId, 'overview']

  const { data: overview } = useQuery({
    queryKey: overviewKey,
    queryFn: () => api.teams.getOverview(teamId),
    enabled: open,
  })
  const currentName = overview?.name ?? teamName
  const canManageSettings = overview?.myPermissions.canManageTeamSettings ?? false
  const canManageMembers = overview?.myPermissions.canManageMembers ?? false

  const [nameDraft, setNameDraft] = useState(teamName)
  useEffect(() => {
    if (open) setNameDraft(currentName)
  }, [open, currentName])

  const renameMutation = useMutation({
    mutationFn: (name: string) => api.teams.rename(teamId, name),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error renaming team')
        return
      }
      queryClient.invalidateQueries({ queryKey: overviewKey })
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
    },
    onError: () => toast.error('Error renaming team'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
          <DialogDescription>Rename the team and manage its roles.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const trimmed = nameDraft.trim()
              if (trimmed && trimmed !== currentName) renameMutation.mutate(trimmed)
            }}
            className="space-y-2"
          >
            <Label htmlFor="edit-team-name">Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-team-name"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                disabled={!canManageSettings}
                className="h-10 flex-1"
              />
              {canManageSettings && (
                <button
                  type="submit"
                  disabled={
                    renameMutation.isPending ||
                    !nameDraft.trim() ||
                    nameDraft.trim() === currentName
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                >
                  {renameMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {!canManageSettings && (
              <p className="text-[11px] text-muted-foreground/60">
                You don&apos;t have permission to rename this team.
              </p>
            )}
          </form>

          <TeamRolesEditor teamId={teamId} canManage={canManageMembers} />
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
