'use client'

import { Checkbox } from '@/components/ui/checkbox'

export interface TeamRolePermissionsValue {
  canManageLists: boolean
  canManageCalendar: boolean
  canManageMembers: boolean
  canManageTeamSettings: boolean
}

interface TeamRolePermissionsFieldsProps {
  value: TeamRolePermissionsValue
  onChange: (value: TeamRolePermissionsValue) => void
}

export const TEAM_ROLE_PERMISSION_FIELDS: {
  key: keyof TeamRolePermissionsValue
  label: string
  description: string
}[] = [
  {
    key: 'canManageLists',
    label: 'Manage lists',
    description: 'Create lists in this team.',
  },
  {
    key: 'canManageCalendar',
    label: 'Manage calendar',
    description: 'Create calendar categories in this team.',
  },
  {
    key: 'canManageMembers',
    label: 'Manage members',
    description: 'Add/remove members, change roles, and create/delete team roles.',
  },
  {
    key: 'canManageTeamSettings',
    label: 'Manage team settings',
    description: 'Rename or delete the team itself.',
  },
]

export function TeamRolePermissionsFields({ value, onChange }: TeamRolePermissionsFieldsProps) {
  return (
    <div className="space-y-2">
      {TEAM_ROLE_PERMISSION_FIELDS.map((field) => (
        <label key={field.key} className="flex items-start gap-2.5 cursor-pointer">
          <Checkbox
            checked={value[field.key]}
            onCheckedChange={(v) => onChange({ ...value, [field.key]: v === true })}
            className="mt-0.5"
          />
          <span className="text-xs">
            <span className="font-medium text-foreground">{field.label}</span>
            <span className="block text-[11px] text-muted-foreground/70">
              {field.description}
            </span>
          </span>
        </label>
      ))}
    </div>
  )
}
