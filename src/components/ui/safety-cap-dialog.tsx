'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { requestLimitIncrease } from '@/api/support/actions'
import type { SafetyCapError } from '@/lib/plan-limits'

const SAFETY_CAP_MESSAGES: Record<SafetyCapError, { title: string; description: string }> = {
  LISTS_CAP: {
    title: 'List limit reached',
    description:
      "You've reached our current technical limit for lists. Let us know and we'll review raising it for your account.",
  },
  HABITS_CAP: {
    title: 'Habit limit reached',
    description:
      "You've reached our current technical limit for habits. Let us know and we'll review raising it for your account.",
  },
  TASKS_CAP: {
    title: 'Task limit reached',
    description:
      "This list has reached our current technical limit for tasks. Let us know and we'll review raising it for your account.",
  },
  SUBTASKS_CAP: {
    title: 'Subtask limit reached',
    description:
      "This task has reached our current technical limit for subtasks. Let us know and we'll review raising it for your account.",
  },
  TAGS_CAP: {
    title: 'Tag limit reached',
    description:
      "You've reached our current technical limit for custom tags. Let us know and we'll review raising it for your account.",
  },
  TRACKING_FIELDS_CAP: {
    title: 'Tracking field limit reached',
    description:
      "You've reached our current technical limit for tracking fields. Let us know and we'll review raising it for your account.",
  },
  GOALS_CAP: {
    title: 'Goal limit reached',
    description:
      "You've reached our current technical limit for goals. Let us know and we'll review raising it for your account.",
  },
  CALENDAR_CATEGORIES_CAP: {
    title: 'Calendar category limit reached',
    description:
      "You've reached our current technical limit for calendar categories. Let us know and we'll review raising it for your account.",
  },
  CONTACTS_CAP: {
    title: 'Contact limit reached',
    description:
      "You've reached our current technical limit for contacts. Let us know and we'll review raising it for your account.",
  },
  TIMER_CATEGORIES_CAP: {
    title: 'Timer category limit reached',
    description:
      "You've reached our current technical limit for timer categories. Let us know and we'll review raising it for your account.",
  },
  TIMER_PRESETS_CAP: {
    title: 'Timer preset limit reached',
    description:
      "You've reached our current technical limit for timer presets. Let us know and we'll review raising it for your account.",
  },
  SHARED_LISTS_CAP: {
    title: 'Shared list limit reached',
    description:
      "You've reached our current technical limit for shared lists. Let us know and we'll review raising it for your account.",
  },
  SHARED_LIST_MEMBERS_CAP: {
    title: 'Member limit reached',
    description:
      "This list has reached our current technical limit for invited members. Let us know and we'll review raising it for your account.",
  },
}

interface SafetyCapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  capError: SafetyCapError | null
}

export function SafetyCapDialog({ open, onOpenChange, capError }: SafetyCapDialogProps) {
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!capError) return null
  const msg = SAFETY_CAP_MESSAGES[capError]

  const handleNotify = async () => {
    setIsSending(true)
    try {
      const result = await requestLimitIncrease({ capError })
      if ('error' in result) {
        toast.error(result.error ?? 'Something went wrong. Please try again.')
        return
      }
      setSent(true)
      toast.success("Request sent — we'll get back to you.")
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSent(false)
        onOpenChange(v)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10">
              <Mail className="h-3.5 w-3.5 text-violet-500" />
            </div>
            {msg.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{msg.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Got it</AlertDialogCancel>
          <Button onClick={handleNotify} disabled={isSending || sent} className="gap-2">
            {sent ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Sent
              </>
            ) : isSending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-3.5 w-3.5" />
                Notify us
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
