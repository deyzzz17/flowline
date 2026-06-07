'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DocPageHeader } from '@/components/docs/docs-components'

const FAQ_ITEMS = [
  {
    category: 'Tasks',
    question: 'How do I create a recurring task?',
    answer:
      'When creating or editing a task, select the "Recurring" type at the top of the form. Choose "Every day" or "Custom days" to pick which days the task should be active. Recurring tasks automatically reset each day they are scheduled.',
  },
  {
    category: 'Tasks',
    question: "Why can't I check off a task that has subtasks?",
    answer:
      'Clicking the checkbox on a task with subtasks will complete all subtasks and the parent task at once. You can also complete subtasks individually — once all are done, the parent task completes automatically.',
  },
  {
    category: 'Tasks',
    question: 'Can subtasks have their own due dates and tags?',
    answer:
      "Yes. Expand a subtask using the chevron icon to set a description, due date, and tags. A subtask's due date cannot be later than the parent task's due date — you'll see an error if there's a conflict.",
  },
  {
    category: 'Tasks',
    question: 'How do I mention another task in a description?',
    answer:
      'Type @ followed by the task name in any description field. A dropdown will suggest matching tasks — select one to create a clickable link. Mentions appear in red if the referenced task is deleted.',
  },
  {
    category: 'Tasks',
    question: 'What happens to a task when I move it to trash?',
    answer:
      'Trashed tasks are kept for 15 days before being permanently deleted. You can restore them at any time from the Trash tab. Each trashed task shows how many days remain before permanent deletion.',
  },
  {
    category: 'Tasks',
    question: 'How does auto-delete on due date work?',
    answer:
      'When enabled on a task, it will automatically move to trash once its due date passes. It still remains in trash for 15 days before permanent deletion, so you can restore it if needed.',
  },
  {
    category: 'Tasks',
    question: 'Can I assign a task to multiple lists?',
    answer:
      'A task belongs to one list at a time. You can move it to a different list by editing the task and selecting a new list. Tasks without a list are assigned to your default list.',
  },
  {
    category: 'Tasks',
    question: 'What is the Today view?',
    answer:
      'The Today view shows all tasks due today plus all recurring tasks scheduled for the current day. It updates automatically — you cannot add tasks directly to it, but tasks appear here based on their due date or recurrence schedule.',
  },

  {
    category: 'Lists',
    question: 'Can two lists have the same name?',
    answer:
      "No — each list must have a unique name. If you try to create or rename a list with a name that already exists, you'll see an error message indicating the conflict.",
  },
  {
    category: 'Lists',
    question: 'What happens to tasks when I delete a list?',
    answer:
      'Deleting a list permanently deletes all tasks inside it as well. This action cannot be undone, so make sure you no longer need those tasks before deleting the list.',
  },

  {
    category: 'Habits',
    question: 'What habit frequency options are available?',
    answer:
      'You can set a habit to repeat daily, on specific days of the week, a certain number of times per week, or every X days. Each frequency has its own streak and completion rate calculation.',
  },
  {
    category: 'Habits',
    question: 'How are habit streaks calculated?',
    answer:
      'A streak counts consecutive periods where you completed the habit on every scheduled day. For daily habits, each day counts. For weekly habits, each week where you hit your target counts. Missing a scheduled day resets the streak.',
  },
  {
    category: 'Habits',
    question: 'What are habit goals?',
    answer:
      'Habits can have goals — either manual milestones you mark complete yourself, or field-based goals tied to tracked values (like "run 100km total"). When a field-based goal is reached, you can claim it as a trophy from the habit detail page.',
  },
  {
    category: 'Habits',
    question: 'Can habits appear in the calendar?',
    answer:
      'Yes. When creating or editing a habit, enable "Show in calendar". You can set a fixed time or position it relative to another calendar event (before or after). Completed habits appear with a checkmark in the calendar.',
  },

  {
    category: 'Calendar',
    question: 'How do I connect Google Calendar?',
    answer:
      "Go to your profile settings and connect your Google account if you haven't already. Then in the Calendar section, enable Google Calendar sync. Your calendars will appear in the sidebar where you can toggle each one on or off.",
  },
  {
    category: 'Calendar',
    question: 'Can I edit a single occurrence of a recurring event?',
    answer:
      "Yes. When you edit or delete a recurring event, you'll be asked whether to apply the change to just this occurrence, this and all following occurrences, or all occurrences in the series.",
  },
  {
    category: 'Calendar',
    question: 'Can I drag and drop events to reschedule them?',
    answer:
      'Yes — you can drag any Flowline event to a new time slot. Google Calendar events are read-only and cannot be moved from within Flowline.',
  },

  {
    category: 'Timer',
    question: 'What is the difference between a free timer and a session timer?',
    answer:
      'A free timer runs without a fixed duration — you stop it manually. A session timer has a defined length (e.g. 90 minutes) and can include work/break phases (Pomodoro-style). Both log your focus time and can be associated with a category and task.',
  },
  {
    category: 'Timer',
    question: 'How do saved timer configs work?',
    answer:
      'Configs save your timer settings — duration, work/break phases, category, and subcategory — so you can start a session with one click. They appear in the sidebar panel on the timer page. Free timer configs with work/break phases also show those durations in the config card.',
  },
  {
    category: 'Timer',
    question: 'Can I associate a focus session with a specific task?',
    answer:
      'Yes. Before or during a session, you can link it to a task. The session time will appear on the task card, and the task can be marked as complete when the session ends.',
  },

  {
    category: 'Dashboard',
    question: 'How is the day progress percentage calculated?',
    answer:
      'The ring on the dashboard uses a weighted score: tasks account for 40%, habits 40%, and focus time 20%. This reflects that tasks and habits are the core of your day, while focus time is a supporting metric.',
  },
  {
    category: 'Dashboard',
    question: 'What are the dashboard insights?',
    answer:
      'Flowline analyses your habits, focus sessions, and tasks in real time to surface relevant observations — like a habit streak at risk, a drop in focus time compared to last week, or a task overdue. Insights only appear when there is meaningful data to show.',
  },
]

const CATEGORIES = ['All', ...Array.from(new Set(FAQ_ITEMS.map((f) => f.category)))]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 mt-0.5',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</p>}
    </div>
  )
}

export default function DocsFaqPage() {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered =
    activeCategory === 'All' ? FAQ_ITEMS : FAQ_ITEMS.filter((f) => f.category === activeCategory)

  const grouped = filtered.reduce<Record<string, typeof FAQ_ITEMS>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <>
      <DocPageHeader
        badge="FAQ"
        title="Frequently asked questions"
        description="Quick answers to common questions about Flowline. Browse by category or scroll through all of them."
      />

      <div className="mb-8 flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-all',
              activeCategory === cat
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                : 'border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            {activeCategory === 'All' && (
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                {category}
              </h2>
            )}
            <div className="rounded-xl border border-border/60 bg-card/40 px-5">
              {items.map((item) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
