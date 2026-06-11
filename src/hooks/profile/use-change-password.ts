'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

interface ChangePasswordState {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  isLoading: boolean
  error: string | null
  success: boolean
}

const INITIAL_STATE: ChangePasswordState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  isLoading: false,
  error: null,
  success: false,
}

function validatePassword(current: string, next: string, confirm: string): string | null {
  if (!current) return 'Current password is required.'
  if (next.length < 8) return 'New password must be at least 8 characters.'
  if (next === current) return 'New password must be different from your current password.'
  if (next !== confirm) return 'Passwords do not match.'
  return null
}

export function useChangePassword(onSuccess?: () => void) {
  const [state, setState] = useState<ChangePasswordState>(INITIAL_STATE)

  const set = (patch: Partial<ChangePasswordState>) =>
    setState((prev) => ({ ...prev, ...patch }))

  const reset = () => setState(INITIAL_STATE)

  const isValid =
    state.currentPassword.length > 0 &&
    state.newPassword.length >= 8 &&
    state.newPassword === state.confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validatePassword(
      state.currentPassword,
      state.newPassword,
      state.confirmPassword,
    )
    if (validationError) {
      set({ error: validationError })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const result = await authClient.changePassword({
        currentPassword: state.currentPassword,
        newPassword: state.newPassword,
        revokeOtherSessions: true,
      })

      if (result.error) {
        const msg =
          result.error.code === 'INVALID_PASSWORD'
            ? 'Current password is incorrect.'
            : result.error.message ?? 'Failed to change password. Please try again.'
        set({ isLoading: false, error: msg })
        return
      }

      set({ isLoading: false, success: true })
      setTimeout(() => {
        reset()
        onSuccess?.()
      }, 1500)
    } catch {
      set({ isLoading: false, error: 'Something went wrong. Please try again.' })
    }
  }

  return {
    ...state,
    isValid,
    set,
    reset,
    handleSubmit,
  }
}