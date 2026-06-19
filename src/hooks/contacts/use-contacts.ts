'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  searchContactByEmail,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  listContacts,
  type ContactsPageData,
} from '@/api/contacts/actions'

const PAGE_SIZE = 10

export const useContactSearch = () => {
  const [email, setEmail] = useState('')
  const queryClient = useQueryClient()

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const { data: result, isFetching } = useQuery({
    queryKey: ['contacts', 'search', email.trim().toLowerCase()],
    queryFn: () => searchContactByEmail(email.trim()),
    enabled: isValidEmail,
    staleTime: 0,
  })

  const sendMutation = useMutation({
    mutationFn: (recipientUserId: string) => sendConnectionRequest(recipientUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })

  const searchResult = result && result.ok ? result.value : null
  const searchError = result && !result.ok ? result.error : null

  return {
    email,
    setEmail,
    isValidEmail,
    isSearching: isFetching && isValidEmail,
    searchResult,
    searchError,
    sendRequest: sendMutation.mutate,
    isSending: sendMutation.isPending,
  }
}

export const usePendingRequests = (initialData: ContactsPageData) => {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['contacts', 'page-data'],
    queryFn: () => Promise.resolve(initialData),
    initialData,
    staleTime: 30_000,
  })

  const acceptMutation = useMutation({
    mutationFn: (connectionId: number) => acceptConnectionRequest(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: ['contacts', 'page-data'] })
      const previous = queryClient.getQueryData<ContactsPageData>(['contacts', 'page-data'])
      if (previous) {
        const accepted = previous.pendingReceived.find((r) => r.connectionId === connectionId)
        queryClient.setQueryData<ContactsPageData>(['contacts', 'page-data'], {
          ...previous,
          pendingReceived: previous.pendingReceived.filter((r) => r.connectionId !== connectionId),
          contacts: accepted
            ? {
                ...previous.contacts,
                docs: [
                  ...previous.contacts.docs,
                  { connectionId, user: accepted.user, connectedAt: new Date().toISOString() },
                ].sort((a, b) => a.user.name.localeCompare(b.user.name)),
                total: previous.contacts.total + 1,
              }
            : previous.contacts,
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['contacts', 'page-data'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const declineMutation = useMutation({
    mutationFn: (connectionId: number) => declineConnectionRequest(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: ['contacts', 'page-data'] })
      const previous = queryClient.getQueryData<ContactsPageData>(['contacts', 'page-data'])
      if (previous) {
        queryClient.setQueryData<ContactsPageData>(['contacts', 'page-data'], {
          ...previous,
          pendingReceived: previous.pendingReceived.filter((r) => r.connectionId !== connectionId),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['contacts', 'page-data'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  return {
    received: data?.pendingReceived ?? [],
    sent: data?.pendingSent ?? [],
    accept: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,
    decline: declineMutation.mutate,
    isDeclining: declineMutation.isPending,
  }
}

export const useRecentConnections = (initialData: ContactsPageData) => {
  const { data } = useQuery({
    queryKey: ['contacts', 'page-data'],
    queryFn: () => Promise.resolve(initialData),
    initialData,
    staleTime: 30_000,
  })

  return { recent: data?.recent ?? [] }
}

export const useContactsList = (initialData: ContactsPageData) => {
  const [page, setPage] = useState(1)

  const { data: baseData } = useQuery({
    queryKey: ['contacts', 'page-data'],
    queryFn: () => Promise.resolve(initialData),
    initialData,
    staleTime: 30_000,
  })

  const { data: morePages, isFetching } = useQuery({
    queryKey: ['contacts', 'list', page],
    queryFn: () => listContacts(page, PAGE_SIZE),
    enabled: page > 1,
    staleTime: 30_000,
  })

  const contacts = page > 1 && morePages ? morePages.docs : (baseData?.contacts.docs ?? [])
  const hasMore = page > 1 && morePages ? morePages.hasMore : (baseData?.contacts.hasMore ?? false)
  const total = baseData?.contacts.total ?? 0

  const showMore = () => setPage((p) => p + 1)

  return { contacts, total, hasMore, isLoading: isFetching, showMore }
}
