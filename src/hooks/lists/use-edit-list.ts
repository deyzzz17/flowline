'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { type List } from '@/payload-types'

export const useEditList = (list: List) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(list.name)
  const [categoryName, setCategoryName] = useState(list.category?.name ?? '')
  const [color, setColor] = useState(list.category?.color ?? '#8b5cf6')
  const [editError, setEditError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.lists.edit(list.id, {
        name: name.trim(),
        category: { name: categoryName.trim() || undefined, color },
      }),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['lists'] })

      const previousLists = queryClient.getQueryData(['lists'])

      queryClient.setQueryData<{ docs: List[] }>(['lists'], (old) => {
        if (!old) return old
        return {
          ...old,
          docs: old.docs.map((l) =>
            l.id === list.id
              ? {
                  ...l,
                  name: name.trim(),
                  category: {
                    ...l.category,
                    name: categoryName.trim() || l.category?.name,
                    color,
                  },
                }
              : l,
          ),
        }
      })

      setEditOpen(false)

      return { previousLists }
    },

    onSuccess: (result) => {
      if (!result.ok) {
        queryClient.invalidateQueries({ queryKey: ['lists'] })
        setEditError(
          result.error === 'DUPLICATE_NAME'
            ? `A list named "${name.trim()}" already exists. Please choose a different name.`
            : result.error ?? 'Error while editing the list.',
        )
        setEditOpen(true)
        return
      }
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      if (result.value.slug && result.value.slug !== list.slug) {
        router.push(`/lists/${result.value.slug}`)
      }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(['lists'], context.previousLists)
      }
      setEditError('Error while editing the list.')
      setEditOpen(true)
    },
  })

  const handleOpen = () => {
    setName(list.name)
    setCategoryName(list.category?.name ?? '')
    setColor(list.category?.color ?? '#8b5cf6')
    setEditError(null)
    setEditOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setEditError('Name is required.')
      return
    }
    setEditError(null)
    mutation.mutate()
  }

  return {
    editOpen,
    setEditOpen,
    name,
    setName,
    categoryName,
    setCategoryName,
    color,
    setColor,
    editError,
    setEditError,
    handleOpen,
    handleSubmit,
    isPending: mutation.isPending,
  }
}