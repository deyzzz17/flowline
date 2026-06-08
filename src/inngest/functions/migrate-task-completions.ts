import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'

type SystemTag = 'urgent' | 'work' | 'personal' | 'health' | 'finance' | 'learning'

export const migrateTaskCompletions = inngest.createFunction(
  {
    id: 'migrate-task-completions',
    name: 'Migrate — Backfill task-completions from completed tasks',
    triggers: { event: 'tasks/migrate-completions' },
  },
  async ({ step }) => {
    const result = await step.run('backfill-completions', async () => {
      const payload = await getPayload({ config })

      const { docs: completedTasks } = await payload.find({
        collection: 'tasks',
        limit: 0,
        where: { status: { equals: 'completed' } },
      })

      if (completedTasks.length === 0) return { migrated: 0 }

      const { docs: existingSnapshots } = await payload.find({
        collection: 'task-completions',
        limit: 0,
      })
      const alreadyMigratedIds = new Set(existingSnapshots.map((s) => s.taskId))

      const userTagsCache: Record<string, Record<string, { name: string; color: string }>> = {}

      const getUserTags = async (userId: string) => {
        if (userTagsCache[userId]) return userTagsCache[userId]
        const { docs: tags } = await payload.find({
          collection: 'user-tags',
          where: { userId: { equals: userId } },
          limit: 0,
        })
        const map: Record<string, { name: string; color: string }> = {}
        tags.forEach((t) => {
          map[String(t.id)] = { name: t.name, color: t.color }
        })
        userTagsCache[userId] = map
        return map
      }

      let migrated = 0
      let skipped = 0

      for (const task of completedTasks) {
        if (alreadyMigratedIds.has(task.id)) {
          skipped++
          continue
        }

        if (!task.completedAt) {
          skipped++
          continue
        }

        const userId = task.userId as string
        const tagMap = await getUserTags(userId)

        const customTagIds = (task.customTags ?? []).map((t: any) =>
          typeof t === 'object' ? String(t.id) : String(t),
        )
        const customTagsSnapshot = customTagIds
          .map((id: string) => (tagMap[id] ? { id: parseInt(id), ...tagMap[id] } : null))
          .filter(Boolean)

        const listId =
          task.list && typeof task.list === 'object'
            ? (task.list as any).id
            : typeof task.list === 'number'
              ? task.list
              : null
        let listName: string | null = null
        if (listId) {
          try {
            const list = await payload.findByID({ collection: 'lists', id: listId })
            listName = list.name ?? null
          } catch {}
        }

        await payload.create({
          collection: 'task-completions',
          data: {
            userId,
            taskId: task.id,
            taskTitle: task.title,
            completedAt: task.completedAt as string,
            tags: (task.tags ?? []) as SystemTag[],
            customTagsSnapshot,
            listId: listId ?? undefined,
            listName: listName ?? undefined,
          },
        })

        migrated++
      }

      return {
        total: completedTasks.length,
        migrated,
        skipped,
      }
    })

    return result
  },
)
