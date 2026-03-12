import {
  createTask,
  deleteTask,
  listTasks,
  updateTaskStatus,
  softDeleteTask,
  moveToTrash,
  toggleTaskStatus,
} from './actions'

export const tasksAPI = {
  create: createTask,
  list: listTasks,
  updateStatus: updateTaskStatus,
  delete: deleteTask,
  softDelete: softDeleteTask,
  trash: moveToTrash,
  toggleStatus: toggleTaskStatus,
}
