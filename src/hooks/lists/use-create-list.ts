import { useState } from 'react'

export const useCreateList = () => {
  const [name, setName] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [color, setColor] = useState('#8b5cf6')
  const [error, setError] = useState<string | null>(null)
  const [limitOpen, setLimitOpen] = useState(false)

  return {
    name,
    setName,
    categoryName,
    setCategoryName,
    color,
    setColor,
    error,
    setError,
    limitOpen,
    setLimitOpen,
  }
}
