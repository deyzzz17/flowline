'use client'

import { useState } from 'react'

export const useSidebarFooter = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  return {
    feedbackOpen,
    setFeedbackOpen,
  }
}
