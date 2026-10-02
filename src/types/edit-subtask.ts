export type EditSubtask = {
  // Array-row id of an existing subtask (undefined for a new one).
  id?: string
  title: string
  done: boolean
  description?: string
  dueDate?: Date
  tags?: string[]
  assignedTo?: string[]
}
