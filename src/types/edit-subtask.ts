export type EditSubtask = {
  title: string
  done: boolean
  description?: string
  dueDate?: Date
  tags?: string[]
  assignedTo?: string[]
}
