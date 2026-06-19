'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  searchContactByEmail,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  listPendingRequests,
  listSentPendingRequests,
  listContacts,
  listRecentConnections,
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

export const usePendingRequests = () => {
  const queryClient = useQueryClient()

  const { data: received = [], isLoading: isLoadingReceived } = useQuery({
    queryKey: ['connections', 'pending-received'],
    queryFn: () => listPendingRequests(),
    staleTime: 15_000,
  })

  const { data: sent = [], isLoading: isLoadingSent } = useQuery({
    queryKey: ['connections', 'pending-sent'],
    queryFn: () => listSentPendingRequests(),
    staleTime: 15_000,
  })

  const acceptMutation = useMutation({
    mutationFn: (connectionId: number) => acceptConnectionRequest(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const declineMutation = useMutation({
    mutationFn: (connectionId: number) => declineConnectionRequest(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  return {
    received,
    sent,
    isLoading: isLoadingReceived || isLoadingSent,
    accept: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,
    decline: declineMutation.mutate,
    isDeclining: declineMutation.isPending,
  }
}

export const useContactsList = () => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', 'list', visibleCount],
    queryFn: () => listContacts(Math.ceil(visibleCount / PAGE_SIZE), PAGE_SIZE),
    staleTime: 15_000,
  })

  const showMore = () => setVisibleCount((c) => c + PAGE_SIZE)

  return {
    contacts: data?.docs ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading,
    showMore,
  }
}

export const useRecentConnections = () => {
  const { data: recent = [], isLoading } = useQuery({
    queryKey: ['connections', 'recent'],
    queryFn: () => listRecentConnections(),
    staleTime: 30_000,
  })

  return { recent, isLoading }
}
