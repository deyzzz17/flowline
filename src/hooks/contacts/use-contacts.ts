'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  searchContactByEmail,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  removeContact,
  listContacts,
  type ContactsPageData,
  type PendingRequest,
} from '@/api/contacts/actions'

const PAGE_SIZE = 10
const PAGE_DATA_KEY = ['contacts', 'page-data']
const PENDING_RECEIVED_KEY = ['connections', 'pending-received']

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
    onSuccess: (response, recipientUserId) => {
      if (!response.ok) return
      queryClient.setQueriesData<any>({ queryKey: ['contacts', 'search'] }, (old: any) => {
        if (!old?.ok || !old.value || old.value.user.id !== recipientUserId) return old
        return { ...old, value: { ...old.value, relationship: 'pending_sent' } }
      })
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
    queryKey: PAGE_DATA_KEY,
    queryFn: () => Promise.resolve(initialData),
    initialData,
    staleTime: Infinity,
  })

  const acceptMutation = useMutation({
    mutationFn: (connectionId: number) => acceptConnectionRequest(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: PAGE_DATA_KEY })
      await queryClient.cancelQueries({ queryKey: PENDING_RECEIVED_KEY })

      const previousPageData = queryClient.getQueryData<ContactsPageData>(PAGE_DATA_KEY)
      const previousPendingReceived =
        queryClient.getQueryData<PendingRequest[]>(PENDING_RECEIVED_KEY)

      if (previousPageData) {
        const accepted = previousPageData.pendingReceived.find(
          (r) => r.connectionId === connectionId,
        )
        queryClient.setQueryData<ContactsPageData>(PAGE_DATA_KEY, {
          ...previousPageData,
          pendingReceived: previousPageData.pendingReceived.filter(
            (r) => r.connectionId !== connectionId,
          ),
          contacts: accepted
            ? {
                ...previousPageData.contacts,
                docs: [
                  ...previousPageData.contacts.docs,
                  { connectionId, user: accepted.user, connectedAt: new Date().toISOString() },
                ].sort((a, b) => a.user.name.localeCompare(b.user.name)),
                total: previousPageData.contacts.total + 1,
              }
            : previousPageData.contacts,
        })
      }

      queryClient.setQueryData<PendingRequest[]>(
        PENDING_RECEIVED_KEY,
        (old) => old?.filter((r) => r.connectionId !== connectionId) ?? [],
      )

      return { previousPageData, previousPendingReceived }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPageData) {
        queryClient.setQueryData(PAGE_DATA_KEY, context.previousPageData)
      }
      if (context?.previousPendingReceived) {
        queryClient.setQueryData(PENDING_RECEIVED_KEY, context.previousPendingReceived)
      }
    },
  })

  const declineMutation = useMutation({
    mutationFn: (connectionId: number) => declineConnectionRequest(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: PAGE_DATA_KEY })
      await queryClient.cancelQueries({ queryKey: PENDING_RECEIVED_KEY })

      const previousPageData = queryClient.getQueryData<ContactsPageData>(PAGE_DATA_KEY)
      const previousPendingReceived =
        queryClient.getQueryData<PendingRequest[]>(PENDING_RECEIVED_KEY)

      if (previousPageData) {
        queryClient.setQueryData<ContactsPageData>(PAGE_DATA_KEY, {
          ...previousPageData,
          pendingReceived: previousPageData.pendingReceived.filter(
            (r) => r.connectionId !== connectionId,
          ),
        })
      }

      queryClient.setQueryData<PendingRequest[]>(
        PENDING_RECEIVED_KEY,
        (old) => old?.filter((r) => r.connectionId !== connectionId) ?? [],
      )

      return { previousPageData, previousPendingReceived }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPageData) {
        queryClient.setQueryData(PAGE_DATA_KEY, context.previousPageData)
      }
      if (context?.previousPendingReceived) {
        queryClient.setQueryData(PENDING_RECEIVED_KEY, context.previousPendingReceived)
      }
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
    queryKey: PAGE_DATA_KEY,
    queryFn: () => Promise.resolve(initialData),
    initialData,
    staleTime: Infinity,
  })

  return { recent: data?.recent ?? [] }
}

export const useContactsList = (initialData: ContactsPageData) => {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: baseData } = useQuery({
    queryKey: PAGE_DATA_KEY,
    queryFn: () => Promise.resolve(initialData),
    initialData,
    staleTime: Infinity,
  })

  const { data: morePages, isFetching } = useQuery({
    queryKey: ['contacts', 'list', page],
    queryFn: () => listContacts(page, PAGE_SIZE),
    enabled: page > 1,
    staleTime: Infinity,
  })

  const contacts = page > 1 && morePages ? morePages.docs : (baseData?.contacts.docs ?? [])
  const hasMore = page > 1 && morePages ? morePages.hasMore : (baseData?.contacts.hasMore ?? false)
  const total = baseData?.contacts.total ?? 0

  const showMore = () => setPage((p) => p + 1)

  const removeMutation = useMutation({
    mutationFn: (connectionId: number) => removeContact(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: PAGE_DATA_KEY })
      await queryClient.cancelQueries({ queryKey: ['contacts', 'list'] })

      const previousPageData = queryClient.getQueryData<ContactsPageData>(PAGE_DATA_KEY)
      const previousListPages = queryClient.getQueriesData({ queryKey: ['contacts', 'list'] })

      if (previousPageData) {
        queryClient.setQueryData<ContactsPageData>(PAGE_DATA_KEY, {
          ...previousPageData,
          contacts: {
            ...previousPageData.contacts,
            docs: previousPageData.contacts.docs.filter((c) => c.connectionId !== connectionId),
            total: Math.max(0, previousPageData.contacts.total - 1),
          },
          recent: previousPageData.recent.filter((r) => r.connectionId !== connectionId),
        })
      }

      queryClient.setQueriesData<any>({ queryKey: ['contacts', 'list'] }, (old: any) => {
        if (!old) return old
        return {
          ...old,
          docs: old.docs.filter((c: any) => c.connectionId !== connectionId),
          total: Math.max(0, old.total - 1),
        }
      })

      return { previousPageData, previousListPages }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPageData) {
        queryClient.setQueryData(PAGE_DATA_KEY, context.previousPageData)
      }
      context?.previousListPages?.forEach(([key, value]) => {
        queryClient.setQueryData(key, value)
      })
    },
  })

  return {
    contacts,
    total,
    hasMore,
    isLoading: isFetching,
    showMore,
    removeContact: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
  }
}
