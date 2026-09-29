import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Admins } from './collections/Admins'
import { Media } from './collections/Media'
import { Tasks } from './collections/Tasks'
import { UserTags } from './collections/UserTags'
import { Lists } from './collections/Lists'
import { TimerCategories } from './collections/TimerCategories'
import { TimerSessions } from './collections/TimerSessions'
import { CalendarEvents } from './collections/CalendarEvents'
import { TimerConfigs } from './collections/TimerConfigs'
import { CalendarCategories } from './collections/CalendarCategories'
import { GoogleCalendarSyncs } from './collections/GoogleCalendarSyncs'
import { Habits } from './collections/Habits'
import { HabitCompletions } from './collections/HabitCompletions'
import { TaskCompletions } from './collections/TaskCompletion'
import { Connections } from './collections/Connections'
import { ListMembers } from './collections/ListMembers'
import { TaskComments } from './collections/TaskComments'
import { WorkspaceMemberArchive } from './collections/WorkspaceMemberArchive'
import { WorkspaceArchive } from './collections/WorkspaceArchive'
import { CustomRoles } from './collections/CustomRoles'
import { Teams } from './collections/Teams'
import { TeamRoles } from './collections/TeamRoles'
import { TeamMembers } from './collections/TeamMembers'
import { CalendarEventInvitations } from './collections/CalendarEventInvitations'
import {
  withRealtime,
  taskRoute,
  listRoute,
  listMemberRoute,
  taskCommentRoute,
  teamRoute,
  teamChildRoute,
  customRoleRoute,
  calendarEventRoute,
  calendarCategoryRoute,
  connectionRoute,
  eventInvitationRoute,
  workspaceArchiveRoute,
  invalidateWorkspaceOf,
  invalidateUserDataOf,
  invalidateComplianceOf,
  all,
  withCacheInvalidation,
} from './collections/hooks/realtime'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // withRealtime: pushes live-update hints to other members' open tabs on
  // every change (see src/collections/hooks/realtime.ts). invalidateUserDataOf
  // / withCacheInvalidation: drop the owner's cached dashboard/analytics data
  // (see src/lib/server-cache.ts).
  collections: [
    Admins,
    Media,
    withRealtime(Tasks, taskRoute, invalidateUserDataOf('tasks')),
    withCacheInvalidation(TaskCompletions, invalidateUserDataOf('tasks')),
    withCacheInvalidation(UserTags, all(invalidateUserDataOf('tasks'), invalidateComplianceOf('userId'))),
    withRealtime(Lists, listRoute, invalidateComplianceOf('userId')),
    withCacheInvalidation(TimerCategories, invalidateUserDataOf('timer')),
    withCacheInvalidation(TimerSessions, invalidateUserDataOf('timer')),
    TimerConfigs,
    withRealtime(CalendarEvents, calendarEventRoute, invalidateUserDataOf('calendar')),
    withRealtime(CalendarCategories, calendarCategoryRoute),
    GoogleCalendarSyncs,
    withCacheInvalidation(Habits, invalidateUserDataOf('habits')),
    withCacheInvalidation(HabitCompletions, invalidateUserDataOf('habits')),
    withRealtime(Connections, connectionRoute),
    withRealtime(ListMembers, listMemberRoute),
    withRealtime(TaskComments, taskCommentRoute),
    withRealtime(
      WorkspaceMemberArchive,
      workspaceArchiveRoute,
      all(invalidateWorkspaceOf('organizationId'), invalidateComplianceOf('removedBy')),
    ),
    withRealtime(
      WorkspaceArchive,
      workspaceArchiveRoute,
      all(invalidateWorkspaceOf('organizationId'), invalidateComplianceOf('ownerId')),
    ),
    withRealtime(CustomRoles, customRoleRoute, invalidateWorkspaceOf('workspace')),
    withRealtime(Teams, teamRoute),
    withRealtime(TeamRoles, teamChildRoute),
    withRealtime(TeamMembers, teamChildRoute),
    withRealtime(CalendarEventInvitations, eventInvitationRoute),
  ],
  editor: lexicalEditor(),
  // Unused by the app (and by the admin panel, which uses REST) — disabled so
  // bots probing /api/graphql can't make Vercel boot Payload for nothing.
  graphQL: { disable: true },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    tablesFilter: [
      '!user',
      '!session',
      '!account',
      '!verification',
      '!organization',
      '!member',
      '!invitation',
    ],
  }),
  sharp,
  plugins: [],
})
