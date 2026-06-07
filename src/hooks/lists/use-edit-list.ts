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

  const [optimisticName, setOptimisticName] = useState(list.name)
  const [optimisticCategoryName, setOptimisticCategoryName] = useState(list.category?.name ?? '')
  const [optimisticColor, setOptimisticColor] = useState(list.category?.color ?? '#8b5cf6')

  const mutation = useMutation({
    mutationFn: () =>
      api.lists.edit(list.id, {
        name: name.trim(),
        category: { name: categoryName.trim() || undefined, color },
      }),

    onMutate: async () => {
      setOptimisticName(name.trim())
      setOptimisticCategoryName(categoryName.trim())
      setOptimisticColor(color)
      setEditOpen(false)
    },

    onSuccess: (result) => {
      if (!result.ok) {
        setOptimisticName(list.name)
        setOptimisticCategoryName(list.category?.name ?? '')
        setOptimisticColor(list.category?.color ?? '#8b5cf6')
        setEditError(
          result.error === 'DUPLICATE_NAME'
            ? `A list named "${name.trim()}" already exists. Please choose a different name.`
            : (result.error ?? 'Error while editing the list.'),
        )
        setEditOpen(true)
        return
      }
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      if (result.value.slug && result.value.slug !== list.slug) {
        router.push(`/lists/${result.value.slug}`)
      }
    },

    onError: () => {
      setOptimisticName(list.name)
      setOptimisticCategoryName(list.category?.name ?? '')
      setOptimisticColor(list.category?.color ?? '#8b5cf6')
      setEditError('Error while editing the list.')
      setEditOpen(true)
    },
  })

  const handleOpen = () => {
    setName(optimisticName)
    setCategoryName(optimisticCategoryName)
    setColor(optimisticColor)
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
    optimisticName,
    optimisticCategoryName,
    optimisticColor,
  }
}
