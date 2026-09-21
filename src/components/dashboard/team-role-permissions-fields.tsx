'use client'

import { Checkbox } from '@/components/ui/checkbox'

export interface TeamRolePermissionsValue {
  canManageLists: boolean
  canManageCalendar: boolean
  canManageMembers: boolean
}

interface TeamRolePermissionsFieldsProps {
  value: TeamRolePermissionsValue
  onChange: (value: TeamRolePermissionsValue) => void
}

export function TeamRolePermissionsFields({ value, onChange }: TeamRolePermissionsFieldsProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <Checkbox
          checked={value.canManageLists}
          onCheckedChange={(v) => onChange({ ...value, canManageLists: v === true })}
          className="mt-0.5"
        />
        <span className="text-xs">
          <span className="font-medium text-foreground">Manage lists</span>
          <span className="block text-[11px] text-muted-foreground/70">
            Create lists in this team.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <Checkbox
          checked={value.canManageCalendar}
          onCheckedChange={(v) => onChange({ ...value, canManageCalendar: v === true })}
          className="mt-0.5"
        />
        <span className="text-xs">
          <span className="font-medium text-foreground">Manage calendar</span>
          <span className="block text-[11px] text-muted-foreground/70">
            Create calendar categories in this team.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <Checkbox
          checked={value.canManageMembers}
          onCheckedChange={(v) => onChange({ ...value, canManageMembers: v === true })}
          className="mt-0.5"
        />
        <span className="text-xs">
          <span className="font-medium text-foreground">Manage members</span>
          <span className="block text-[11px] text-muted-foreground/70">
            Add/remove members, change roles, and create/delete team roles.
          </span>
        </span>
      </label>
    </div>
  )
}
