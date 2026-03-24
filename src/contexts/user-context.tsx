'use client'

import { createContext, useContext, useState } from 'react'

type UserData = {
  name: string
  email: string
  image: string | null
}

type UserContextType = {
  user: UserData
  updateUser: (data: Partial<UserData>) => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: UserData
}) {
  const [user, setUser] = useState(initialUser)

  const updateUser = (data: Partial<UserData>) => {
    setUser((prev) => ({ ...prev, ...data }))
  }

  return <UserContext.Provider value={{ user, updateUser }}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
