import { useState } from 'react'

export const useManageForm = () => {
  const [isOpen, setIsOpen] = useState(false)
  const close = () => setIsOpen(false)
  return { isOpen, close, setIsOpen }
}
