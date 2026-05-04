'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { toast } from 'sonner'

export interface CalendarCategory {
  id: number
  name: string
  color: string
  isDefault: boolean
}

export const useCalendarCategories = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-categories'],
    queryFn: () => api.calendar.categories.list(),
    staleTime: 60_000,
  })

  const categories: CalendarCategory[] = (data?.docs ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    isDefault: c.isDefault ?? false,
  }))

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      api.calendar.categories.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-categories'] }),
    onError: () => toast.error('Failed to create category'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; color?: string } }) =>
      api.calendar.categories.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-categories'] }),
    onError: () => toast.error('Failed to update category'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.calendar.categories.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['calendar-categories'] })
      const previous = queryClient.getQueryData(['calendar-categories'])
      queryClient.setQueryData(['calendar-categories'], (old: any) => ({
        ...old,
        docs: (old?.docs ?? []).filter((c: any) => c.id !== id),
      }))
      return { previous }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['calendar-categories'], context?.previous)
      toast.error('Failed to delete category')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['calendar-categories'] }),
  })

  return {
    categories,
    isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
  }
}