'use client'

import { useState } from 'react'
import { toggleTaskStatusAction } from '@/app/(frontend)/Tasks/actions'

export const useTask = () => {
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleStatus = async (id: string, currentStatus: 'active' | 'completed') => {
    setIsUpdating(true)

    const result = await toggleTaskStatusAction(id, currentStatus)

    setIsUpdating(false)
    return result.success
  }

  return {
    toggleStatus,
    isUpdating,
  }
}
