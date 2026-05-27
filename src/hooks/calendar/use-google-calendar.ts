'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGoogleCalendarStatus,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  updateGoogleCalendarSettings,
} from '@/api/google-calendar/actions'
import { toast } from 'sonner'

export const useGoogleCalendar = () => {
  const queryClient = useQueryClient()

  const { data: status, isLoading } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: getGoogleCalendarStatus,
    staleTime: 60_000,
  })

  const connectMutation = useMutation({
    mutationFn: connectGoogleCalendar,
    onSuccess: (result) => {
      if ('error' in result) { toast.error(result.error); return }
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events-google'] })
      toast.success('Google Calendar connected!')
    },
    onError: () => toast.error('Failed to connect Google Calendar'),
  })

  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events-google'] })
      toast.success('Google Calendar disconnected')
    },
    onError: () => toast.error('Failed to disconnect'),
  })

  const updateSettingsMutation = useMutation({
    mutationFn: updateGoogleCalendarSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events-google'] })
    },
  })

  return {
    status,
    isLoading,
    isConnected: status?.connected ?? false,
    calendars: status?.calendars ?? [],
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  }
}