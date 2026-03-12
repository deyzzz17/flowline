'use client'

import { useState } from 'react'
import { toggleTaskStatusAction } from '@/app/(frontend)/Tasks/actions'
import { softDeleteTaskAction } from '@/app/(frontend)/Tasks/actions'
import { moveToTrashAction } from '@/app/(frontend)/Tasks/actions'

export const useTask = () => {
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleStatus = async (id: number, currentStatus: 'active' | 'completed') => {
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
