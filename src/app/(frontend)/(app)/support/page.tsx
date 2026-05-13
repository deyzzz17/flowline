import { ProtectedRoute } from '@/components/route/protected-route'
import { SupportClient } from '@/components/support/support-client'

export const metadata = {
  title: 'Flowline Support',
  description: 'Get help and find answers to common questions.',
}

const FAQ_ITEMS = [
  {
    question: 'How do I create a recurring task?',
    answer:
      'When creating or editing a task, select the "Recurring" type at the top of the form. You can then choose between "Every day" or "Custom days" to set which days of the week the task should be active.',
  },
  {
    question: 'What happens to a task when I move it to trash?',
    answer:
      'Trashed tasks are kept for 15 days before being permanently deleted. During this period, you can restore them at any time. The number of days remaining is shown on each trashed task.',
  },
  {
    question: 'Can I assign a task to multiple lists?',
    answer:
      'Currently, a task can only belong to one list at a time. You can move a task to a different list by editing it and selecting the desired list.',
  },
  {
    question: 'How does auto-delete on due date work?',
    answer:
      'When enabled, a task will automatically be moved to trash once its due date has passed. This is processed hourly by our system. The task will still remain in trash for 15 days before permanent deletion.',
  },
  {
    question: 'How do I mention another task in a description?',
    answer:
      'Type @ followed by the task name in any description field. A dropdown will appear with matching tasks. Select one to insert a clickable reference. If the referenced task is deleted, the mention will appear in red.',
  },
  {
    question: "Why can't I check off a task that has subtasks?",
    answer:
      'A task with subtasks can only be marked as complete once all its subtasks are done. Complete each subtask first, and the parent task will automatically be marked as completed.',
  },
  {
    question: 'What is the Today view?',
    answer:
      "The Today view shows all tasks that are due today plus all recurring tasks scheduled for the current day of the week. It's a smart list that updates automatically — you can't add tasks directly to it.",
  },
  {
    question: 'Can subtasks have their own due dates?',
    answer:
      "Yes, subtasks can have their own due dates. However, a subtask's due date cannot be set after the parent task's due date. You'll receive a notification if there's a conflict.",
  },
]

export default function SupportPage() {
  return (
    <ProtectedRoute>
      <SupportClient faqItems={FAQ_ITEMS} />
    </ProtectedRoute>
  )
}
