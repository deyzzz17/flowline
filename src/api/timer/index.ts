import { listTimerCategories, createTimerCategory, deleteTimerCategory } from './actions'

export const timerAPI = {
  categories: {
    list: listTimerCategories,
    create: createTimerCategory,
    delete: deleteTimerCategory,
  },
}
