import type { Task } from '@/payload-types'

export type TaskSortBy = 'newest' | 'oldest' | 'dueDate' | 'tag'
export type AssigneeFilter = 'all' | 'mine' | 'others'

function primaryTagLabel(task: Task): string | null {
  const fixedTag = (task.tags ?? [])[0]
  if (fixedTag) return fixedTag
  const customTag = (task.customTags ?? [])[0]
  if (customTag && typeof customTag === 'object') return customTag.name
  return null
}

export function sortTasks(tasks: Task[], sortBy: TaskSortBy): Task[] {
  const sorted = [...tasks]

  switch (sortBy) {
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    case 'oldest':
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    case 'tag':
      return sorted.sort((a, b) => {
        const tagA = primaryTagLabel(a)
        const tagB = primaryTagLabel(b)
        if (!tagA && !tagB) return 0
        if (!tagA) return 1
        if (!tagB) return -1
        return tagA.localeCompare(tagB)
      })
    default:
      return sorted
  }
}

export function filterTasksByAssignee(
  tasks: Task[],
  filter: AssigneeFilter,
  currentUserId: string | null | undefined,
): Task[] {
  if (filter === 'all' || !currentUserId) return tasks
  if (filter === 'mine') {
    return tasks.filter((t) => (t.assignedTo ?? []).includes(currentUserId))
  }
  // 'others': assigned to at least one person, and not (only) to me
  return tasks.filter((t) => {
    const assignees = t.assignedTo ?? []
    return assignees.length > 0 && assignees.some((id) => id !== currentUserId)
  })
}
