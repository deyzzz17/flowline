'use client'

import { api } from '@/api'
import { useState } from 'react'

export const useTask = () => {
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleStatus = async (id: number, currentStatus: 'active' | 'completed') => {
    setIsUpdating(true)

    const result = await api.tasks.toggleStatus(id, currentStatus)

    setIsUpdating(false)
    return result.success
  }

  return {
    toggleStatus,
    isUpdating,
  }
}
