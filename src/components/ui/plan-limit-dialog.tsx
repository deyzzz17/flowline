'use client'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import type { LimitError } from '@/lib/plan-limits'

const LIMIT_MESSAGES: Record<LimitError, { title: string; description: string; cta: string }> = {
  LISTS_LIMIT: {
    title: 'List limit reached',
    description:
      "You've reached the maximum number of lists on the Free plan (3). Upgrade to Plus for unlimited lists.",
    cta: 'Upgrade for unlimited lists',
  },
  HABITS_LIMIT: {
    title: 'Habit limit reached',
    description:
      "You've reached the maximum number of habits on the Free plan (5). Upgrade to Plus for unlimited habits.",
    cta: 'Upgrade for unlimited habits',
  },
  TASKS_LIMIT: {
    title: 'Task limit reached',
    description:
      "You've reached the maximum number of tasks per list on the Free plan (50). Upgrade to Plus for unlimited tasks.",
    cta: 'Upgrade for unlimited tasks',
  },
  SUBTASKS_LIMIT: {
    title: 'Subtask limit reached',
    description:
      "You've reached the maximum number of subtasks per task on the Free plan (20). Upgrade to Plus for unlimited subtasks.",
    cta: 'Upgrade for unlimited subtasks',
  },
  TAGS_LIMIT: {
    title: 'Tag limit reached',
    description:
      "You've reached the maximum number of custom tags on the Free plan (10). Upgrade to Plus for unlimited tags.",
    cta: 'Upgrade for unlimited tags',
  },
  TRACKING_FIELDS_LIMIT: {
    title: 'Tracking field limit reached',
    description:
      "You've reached the maximum number of custom tracking fields for this habit (10). Delete one of your existing custom fields, or upgrade to Pro for unlimited tracking fields.",
    cta: 'Upgrade for unlimited tracking fields',
  },
  GOALS_LIMIT: {
    title: 'Goal limit reached',
    description:
      "You've reached the maximum number of goals per habit on the Free plan (5). Upgrade to Plus for unlimited goals.",
    cta: 'Upgrade for unlimited goals',
  },
  CALENDAR_CATEGORIES_LIMIT: {
    title: 'Calendar category limit reached',
    description:
      "You've reached the maximum number of calendar categories on the Free plan (20). Upgrade to Plus for unlimited categories.",
    cta: 'Upgrade for unlimited categories',
  },
  CONTACTS_LIMIT: {
    title: 'Contact limit reached',
    description:
      "You've reached the maximum number of contacts on the Free plan (10). Upgrade to Plus for unlimited contacts.",
    cta: 'Upgrade for unlimited contacts',
  },
  TIMER_CATEGORIES_LIMIT: {
    title: 'Timer category limit reached',
    description:
      "You've reached the maximum number of custom timer categories on the Free plan (10). Upgrade to Plus for unlimited categories.",
    cta: 'Upgrade for unlimited timer categories',
  },
  TIMER_PRESETS_LIMIT: {
    title: 'Timer preset limit reached',
    description:
      "You've reached the maximum number of timer presets on the Free plan (10). Upgrade to Plus for unlimited presets.",
    cta: 'Upgrade for unlimited presets',
  },
  SHARED_LISTS_LIMIT: {
    title: 'Shared list limit reached',
    description:
      "You've reached your plan's limit for shared lists. Upgrade to Plus for up to 3 shared lists, or Pro for unlimited shared lists.",
    cta: 'Upgrade for more shared lists',
  },
  SHARED_LIST_MEMBERS_LIMIT: {
    title: 'Member limit reached',
    description:
      "You've reached your plan's limit for members on this list. Upgrade to Plus to invite up to 3 people, or Pro for unlimited members.",
    cta: 'Upgrade for more members',
  },
}

interface PlanLimitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  limitError: LimitError | null
}

export function PlanLimitDialog({ open, onOpenChange, limitError }: PlanLimitDialogProps) {
  if (!limitError) return null

  const msg = LIMIT_MESSAGES[limitError]

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10">
              <Zap className="h-3.5 w-3.5 text-violet-500" />
            </div>
            {msg.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{msg.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Got it</AlertDialogCancel>
          <Link
            href="/billing"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            <Zap className="h-3.5 w-3.5" />
            {msg.cta}
          </Link>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
