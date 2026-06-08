'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'
import { toast } from 'sonner'

type TaskType = NonNullable<Task['type']>
type TaskTag = NonNullable<Task['tags']>[number]
type RecurrenceFrequency = NonNullable<Task['recurrence']>['frequency']
type RecurrenceDay = NonNullable<NonNullable<Task['recurrence']>['days']>[number]

export type SubtaskDetail = {
  title: string
  done: boolean
  description?: string
  dueDate?: Date
  tags?: string[]
}

let tempIdCounter = -1
function nextTempId() {
  return tempIdCounter--
}

export const useTaskCreation = () => {
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('simple')
  const [tags, setTags] = useState<TaskTag[]>([])
  const [customTags, setCustomTags] = useState<string[]>([])
  const [subtasks, setSubtasks] = useState<SubtaskDetail[]>([])
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily')
  const [days, setDays] = useState<RecurrenceDay[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [autoDeleteOnDueDate, setAutoDeleteOnDueDate] = useState(false)
  const [showError, setShowError] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#8b5cf6')
  const [subtaskInput, setSubtaskInput] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const isInvalid = title.trim() === ''

  const handleSetTitle = (value: string) => {
    setTitle(value)
    if (showError) setShowError(false)
  }

  const toggleTag = (tag: TaskTag) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  const toggleCustomTag = (tagId: string) =>
    setCustomTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )

  const toggleDay = (day: RecurrenceDay) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))

  const addSubtask = (subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return
    setSubtasks((prev) => [...prev, { title: subtaskTitle.trim(), done: false }])
  }

  const removeSubtask = (index: number) => setSubtasks((prev) => prev.filter((_, i) => i !== index))

  const updateSubtaskDetail = (index: number, field: keyof SubtaskDetail, value: unknown) =>
    setSubtasks((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))

  const toggleSubtaskTag = (index: number, tag: string) => {
    const current = subtasks[index]?.tags ?? []
    const updated = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    updateSubtaskDetail(index, 'tags', updated)
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setType('simple')
    setTags([])
    setCustomTags([])
    setSubtasks([])
    setFrequency('daily')
    setDays([])
    setDueDate(undefined)
    setAutoDeleteOnDueDate(false)
    setShowError(false)
  }

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof api.tasks.create>[0]) => api.tasks.create(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousData = queryClient
        .getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
        .map(([queryKey, data]) => ({ queryKey, data }))

      const userTagsData = queryClient.getQueryData<{
        docs: { id: number; name: string; color: string }[]
      }>(['user-tags'])
      const userTags = userTagsData?.docs ?? []
      const resolvedCustomTags = (input.customTags ?? [])
        .map((tagId) => userTags.find((t) => t.id === tagId))
        .filter((t): t is { id: number; name: string; color: string } => t !== undefined)

      const tempId = nextTempId()
      const optimisticTask: Task = {
        id: tempId,
        title: input.title,
        description: input.description ?? '',
        status: 'active',
        type: input.type ?? 'simple',
        tags: (input.tags ?? []) as Task['tags'],
        customTags: resolvedCustomTags as any,
        dueDate: input.dueDate ?? null,
        autoDeleteOnDueDate: input.autoDeleteOnDueDate ?? false,
        subtasks: (input.subtasks ?? []).map((s, i) => ({
          id: String(i),
          title: s.title,
          done: s.done ?? false,
          description: s.description ?? '',
          dueDate: s.dueDate ?? null,
          tags: (s.tags ?? []) as any,
        })) as Task['subtasks'],
        recurrence: (input.recurrence as Task['recurrence']) ?? null,
        list: input.listId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Task

      queryClient
        .getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
        .forEach(([queryKey]) => {
          queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) => {
            if (!old) return old
            return { ...old, docs: [optimisticTask, ...old.docs] }
          })
        })

      return { previousData, tempId }
    },

    onError: (_err, _input, context) => {
      context?.previousData?.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey as string[], data)
      })
      toast.error('Failed to create the task', {
        description: 'Something went wrong. Please try again.',
      })
    },

    onSuccess: () => {
      toast.info('Task created', {
        description: 'Your task has been successfully created.',
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const saveTask = async (listId?: number): Promise<boolean> => {
    if (title.trim() === '') {
      setShowError(true)
      return false
    }

    const input: Parameters<typeof api.tasks.create>[0] = {
      title,
      description,
      type,
      tags,
      customTags: customTags.map((id) => parseInt(id)),
      dueDate: dueDate ? dueDate.toISOString() : null,
      autoDeleteOnDueDate,
      ...(listId !== undefined && { listId }),
      subtasks: subtasks.map((s) => ({
        title: s.title,
        done: s.done,
        ...(s.description && { description: s.description }),
        ...(s.dueDate && { dueDate: s.dueDate.toISOString() }),
        ...(s.tags?.length && { tags: s.tags as NonNullable<Task['subtasks']>[number]['tags'] }),
      })),
      ...(type === 'recurring' && {
        recurrence: {
          frequency,
          ...(frequency === 'custom' && { days }),
        },
      }),
    }

    resetForm()

    try {
      await createMutation.mutateAsync(input)
      return true
    } catch {
      return false
    }
  }

  return {
    title,
    description,
    setTitle: handleSetTitle,
    setDescription,
    showError,
    isLoading: createMutation.isPending,
    isInvalid,
    type,
    setType,
    tags,
    toggleTag,
    customTags,
    toggleCustomTag,
    subtasks,
    addSubtask,
    removeSubtask,
    updateSubtaskDetail,
    toggleSubtaskTag,
    frequency,
    setFrequency,
    days,
    toggleDay,
    dueDate,
    setDueDate,
    autoDeleteOnDueDate,
    setAutoDeleteOnDueDate,
    saveTask,
    resetForm,
    showNewTag,
    setShowNewTag,
    newTagName,
    setNewTagName,
    newTagColor,
    setNewTagColor,
    subtaskInput,
    setSubtaskInput,
    expandedIndex,
    setExpandedIndex,
  }
}
