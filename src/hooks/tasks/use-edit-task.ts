'use client'

import { api } from '@/api'
import { Task } from '@/payload-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type EditDraft = {
  title?: string
  description?: string
  tags?: Task['tags']
  customTags?: number[]
  dueDate?: string | null
  type?: Task['type']
  recurrence?: Task['recurrence']
  subtasks?: Task['subtasks']
}

type UserTag = { id: number; name: string; color: string }

export const useEditTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: EditDraft }) => api.tasks.edit(id, draft),

    onMutate: ({ id, draft }) => {
      const queries = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
      const previousData = queries.map(([queryKey, data]) => ({ queryKey, data }))

      let resolvedCustomTags: UserTag[] | undefined
      if (draft.customTags !== undefined) {
        const userTagsData = queryClient.getQueryData<{ docs: UserTag[] }>(['user-tags'])
        const userTags = userTagsData?.docs ?? []
        resolvedCustomTags = draft.customTags
          .map((tagId) => userTags.find((t) => t.id === tagId))
          .filter((t): t is UserTag => t !== undefined)
      }

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) => {
          if (!old) return old
          return {
            ...old,
            docs: old.docs.map((task) =>
              task.id === id
                ? {
                    ...task,
                    title: draft.title?.trim() ? draft.title : task.title,
                    description: draft.description ?? task.description,
                    tags: draft.tags ?? task.tags,
                    customTags:
                      resolvedCustomTags !== undefined
                        ? (resolvedCustomTags as any)
                        : task.customTags,
                    dueDate: draft.dueDate !== undefined ? draft.dueDate : task.dueDate,
                    type: draft.type ?? task.type,
                    recurrence: draft.recurrence !== undefined ? draft.recurrence : task.recurrence,
                    subtasks:
                      draft.subtasks !== undefined && draft.subtasks !== null
                        ? draft.subtasks.map((s, i) => ({
                            ...(task.subtasks?.[i] ?? {}),
                            ...s,
                            id:
                              (task.subtasks?.[i] as { id?: string } | undefined)?.id ?? String(i),
                          }))
                        : task.subtasks,
                  }
                : task,
            ),
          }
        })
      })

      return { previousData }
    },

    onError: (_err, _vars, context) => {
      context?.previousData?.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey as string[], data)
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
