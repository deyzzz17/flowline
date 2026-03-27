import {
  createTask,
  deleteTask,
  listTasks,
  updateTaskStatus,
  softDeleteTask,
  moveToTrash,
  toggleTaskStatus,
  restoreTask,
  editTask,
  toggleSubtask,
  deleteSubtask,
  syncRecurringTasksForUser,
} from './actions'

export const tasksAPI = {
  create: createTask,
  list: (page = 1) => listTasks(page),
  updateStatus: updateTaskStatus,
  delete: deleteTask,
  softDelete: softDeleteTask,
  trash: moveToTrash,
  toggleStatus: toggleTaskStatus,
  restore: restoreTask,
  edit: editTask,
  toggleSubtask,
  deleteSubtask,
  syncTasks: syncRecurringTasksForUser,
}
