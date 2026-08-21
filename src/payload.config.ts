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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Admins,
    Media,
    Tasks,
    TaskCompletions,
    UserTags,
    Lists,
    TimerCategories,
    TimerSessions,
    TimerConfigs,
    CalendarEvents,
    CalendarCategories,
    GoogleCalendarSyncs,
    Habits,
    HabitCompletions,
    Connections,
    ListMembers,
    TaskComments,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    tablesFilter: ['!user', '!session', '!account', '!verification'],
  }),
  sharp,
  plugins: [],
})
