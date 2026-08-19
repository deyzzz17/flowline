'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, UserPlus, X, Loader2, Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { listContacts } from '@/api/contacts/actions'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import { useListMembers } from '@/hooks/list-members/use-list-members'
import { useInviteMember } from '@/hooks/list-members/use-invite-member'
import { useRemoveMember } from '@/hooks/list-members/use-remove-member'
import { useChangeMemberRole } from '@/hooks/list-members/use-change-member-role'
import {
  LIMIT_ERRORS,
  SAFETY_CAP_ERRORS,
  type LimitError,
  type SafetyCapError,
} from '@/lib/plan-limits'
import { PlanLimitDialog } from '@/components/ui/plan-limit-dialog'
import { SafetyCapDialog } from '@/components/ui/safety-cap-dialog'
import type { List } from '@/payload-types'
import type { ListMemberRole } from '@/api/list-members/actions'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

function MemberAvatar({ name, image }: { name: string; image?: string | null }) {
  return (
    <Avatar className="h-9 w-9 shrink-0">
      <AvatarImage src={image ?? undefined} alt={name} />
      <AvatarFallback className="bg-violet-500/10 text-xs font-semibold text-violet-600 dark:text-violet-400">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

function RoleToggle({
  role,
  onChange,
  disabled,
}: {
  role: ListMemberRole
  onChange: (role: ListMemberRole) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5">
      {(['editor', 'reader'] as ListMemberRole[]).map((r) => (
        <button
          key={r}
          type="button"
          disabled={disabled}
          onClick={() => onChange(r)}
          className={cn(
            'rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-all disabled:opacity-50',
            role === r
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

interface ListMembersPanelProps {
  list: List
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ListMembersPanel({ list, open, onOpenChange }: ListMembersPanelProps) {
  const [search, setSearch] = useState('')
  const [inviteRole, setInviteRole] = useState<ListMemberRole>('editor')
  const [limitDialog, setLimitDialog] = useState<LimitError | null>(null)
  const [capDialog, setCapDialog] = useState<SafetyCapError | null>(null)

  const planLimits = usePlanLimits()
  const { members, isLoading: membersLoading } = useListMembers(list.id)
  const inviteMutation = useInviteMember(list.id)
  const removeMutation = useRemoveMember(list.id)
  const changeRoleMutation = useChangeMemberRole(list.id)

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'list', 'for-invite'],
    queryFn: () => listContacts(1, 200),
    enabled: open,
  })

  const memberUserIds = useMemo(() => new Set(members.map((m) => m.user.id)), [members])

  const invitableContacts = useMemo(() => {
    const contacts = contactsData?.docs ?? []
    const q = search.trim().toLowerCase()
    return contacts.filter((c) => {
      if (memberUserIds.has(c.user.id)) return false
      if (!q) return true
      return c.user.name.toLowerCase().includes(q) || c.user.email.toLowerCase().includes(q)
    })
  }, [contactsData, memberUserIds, search])

  const memberCountLabel = planLimits
    ? planLimits.limits.sharedListMembers === Infinity
      ? `${members.length} member${members.length !== 1 ? 's' : ''}`
      : `${members.length} / ${planLimits.limits.sharedListMembers} members`
    : null

  const handleInvite = (userId: string) => {
    inviteMutation.mutate(
      { userId, role: inviteRole },
      {
        onSuccess: (result) => {
          if (result.ok) return
          if (result.error === LIMIT_ERRORS.SHARED_LISTS_LIMIT) {
            setLimitDialog(LIMIT_ERRORS.SHARED_LISTS_LIMIT)
          } else if (result.error === LIMIT_ERRORS.SHARED_LIST_MEMBERS_LIMIT) {
            setLimitDialog(LIMIT_ERRORS.SHARED_LIST_MEMBERS_LIMIT)
          } else if (result.error === SAFETY_CAP_ERRORS.SHARED_LISTS_CAP) {
            setCapDialog(SAFETY_CAP_ERRORS.SHARED_LISTS_CAP)
          } else if (result.error === SAFETY_CAP_ERRORS.SHARED_LIST_MEMBERS_CAP) {
            setCapDialog(SAFETY_CAP_ERRORS.SHARED_LIST_MEMBERS_CAP)
          }
        },
      },
    )
  }

  return (
    <>
      <PlanLimitDialog
        open={!!limitDialog}
        onOpenChange={(v) => {
          if (!v) setLimitDialog(null)
        }}
        limitError={limitDialog}
      />
      <SafetyCapDialog
        open={!!capDialog}
        onOpenChange={(v) => {
          if (!v) setCapDialog(null)
        }}
        capError={capDialog}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              Manage members
            </DialogTitle>
            <DialogDescription>
              Invite people from your contacts to collaborate on{' '}
              <strong className="text-foreground">{list.name}</strong>.
              {memberCountLabel && <span className="ml-1 text-xs">({memberCountLabel})</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Invite from contacts
                </p>
                <RoleToggle role={inviteRole} onChange={setInviteRole} />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your contacts..."
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {invitableContacts.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground/60">
                    {search
                      ? 'No contacts match your search.'
                      : 'No contacts available to invite — everyone is already a member, or you have no contacts yet.'}
                  </p>
                ) : (
                  invitableContacts.map((c) => (
                    <div
                      key={c.connectionId}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-muted/40 transition-colors"
                    >
                      <MemberAvatar name={c.user.name} image={c.user.image} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {c.user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground/60">{c.user.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInvite(c.user.id)}
                        disabled={inviteMutation.isPending}
                        className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                      >
                        <UserPlus className="h-3 w-3" />
                        Invite
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Members
              </p>
              {membersLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
                </div>
              ) : members.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground/60">
                  This list isn&apos;t shared yet — invite someone from your contacts above.
                </p>
              ) : (
                <div className="space-y-1">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-muted/40 transition-colors"
                    >
                      <MemberAvatar name={m.user.name} image={m.user.image} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {m.user.name}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                              m.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                            )}
                          >
                            {m.status === 'pending' ? (
                              'Invited'
                            ) : (
                              <>
                                <Check className="h-2.5 w-2.5" />
                                Member
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <RoleToggle
                        role={m.role}
                        disabled={changeRoleMutation.isPending}
                        onChange={(role) => changeRoleMutation.mutate({ memberId: m.id, role })}
                      />
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(m.id)}
                        disabled={removeMutation.isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
