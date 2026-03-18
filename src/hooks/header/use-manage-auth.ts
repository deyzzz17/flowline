import { useState } from 'react'

export const useManageAuth = () => {
  const [open, setOpen] = useState(false)
  const change = () => setOpen(!open)
  return { open, change }
}
