import { useState } from 'react'

export const useManageDisplay = () => {
  const [open, setOpen] = useState(false)
  const change = () => setOpen(!open)
  return { open, change }
}
