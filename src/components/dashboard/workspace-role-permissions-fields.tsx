'use client'

import { Checkbox } from '@/components/ui/checkbox'

export interface WorkspaceRolePermissionsValue {
  canManageWorkspaceSettings: boolean
  canManageMembers: boolean
  canManageLists: boolean
  canManageCalendar: boolean
  canManageTeams: boolean
  canPermanentlyDeleteTasks: boolean
  canDeleteCalendarCategories: boolean
}

interface WorkspaceRolePermissionsFieldsProps {
  value: WorkspaceRolePermissionsValue
  onChange: (value: WorkspaceRolePermissionsValue) => void
}

const FIELDS: {
  key: keyof WorkspaceRolePermissionsValue
  label: string
  description: string
}[] = [
  {
    key: 'canManageWorkspaceSettings',
    label: 'Manage workspace settings',
    description: 'Rename the workspace, change its icon/color.',
  },
  {
    key: 'canManageMembers',
    label: 'Manage members',
    description: 'Invite/remove workspace members and change their role.',
  },
  {
    key: 'canManageLists',
    label: 'Manage lists',
    description: 'Create lists directly in the workspace (outside of any team).',
  },
  {
    key: 'canManageCalendar',
    label: 'Manage calendar',
    description: 'Create calendar events/categories directly in the workspace (outside of any team).',
  },
  {
    key: 'canManageTeams',
    label: 'Manage teams',
    description: 'Create teams in this workspace.',
  },
  {
    key: 'canPermanentlyDeleteTasks',
    label: 'Permanently delete tasks',
    description: 'Empty the trash for good, not just move tasks there.',
  },
  {
    key: 'canDeleteCalendarCategories',
    label: 'Delete calendar categories',
    description: 'Delete a category and its events.',
  },
]

export function WorkspaceRolePermissionsFields({
  value,
  onChange,
}: WorkspaceRolePermissionsFieldsProps) {
  return (
    <div className="space-y-2">
      {FIELDS.map((field) => (
        <label key={field.key} className="flex items-start gap-2.5 cursor-pointer">
          <Checkbox
            checked={value[field.key]}
            onCheckedChange={(v) => onChange({ ...value, [field.key]: v === true })}
            className="mt-0.5"
          />
          <span className="text-xs">
            <span className="font-medium text-foreground">{field.label}</span>
            <span className="block text-[11px] text-muted-foreground/70">{field.description}</span>
          </span>
        </label>
      ))}
    </div>
  )
}
