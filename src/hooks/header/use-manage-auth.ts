import { useState } from 'react'

export const useManageDisplay = () => {
  const [open, setOpen] = useState(false)
  const change = (value?: boolean) => {
    if (value !== undefined) setOpen(value)
    else setOpen((prev) => !prev)
  }
  return { open, change }
}
