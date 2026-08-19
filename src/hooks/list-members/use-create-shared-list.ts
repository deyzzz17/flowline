'use client'

import { useState } from 'react'
import type { ListMemberRole } from '@/api/list-members/actions'
import type { ContactProfile } from '@/api/contacts/actions'

export interface SelectedInvitee {
  user: ContactProfile
  role: ListMemberRole
}

export const useCreateSharedList = () => {
  const [name, setName] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [color, setColor] = useState('#8b5cf6')
  const [search, setSearch] = useState('')
  const [invitees, setInvitees] = useState<SelectedInvitee[]>([])
  const [error, setError] = useState<string | null>(null)

  const addInvitee = (user: ContactProfile, role: ListMemberRole) => {
    setInvitees((prev) => [...prev.filter((i) => i.user.id !== user.id), { user, role }])
  }

  const removeInvitee = (userId: string) => {
    setInvitees((prev) => prev.filter((i) => i.user.id !== userId))
  }

  const setInviteeRole = (userId: string, role: ListMemberRole) => {
    setInvitees((prev) => prev.map((i) => (i.user.id === userId ? { ...i, role } : i)))
  }

  return {
    name,
    setName,
    categoryName,
    setCategoryName,
    color,
    setColor,
    search,
    setSearch,
    invitees,
    addInvitee,
    removeInvitee,
    setInviteeRole,
    error,
    setError,
  }
}
