import {
  listTimerCategories,
  createTimerCategory,
  deleteTimerCategory,
  createTimerSession,
  getTimerAnalytics,
} from './actions'

export const timerAPI = {
  categories: {
    list: listTimerCategories,
    create: createTimerCategory,
    delete: deleteTimerCategory,
  },
  sessions: {
    create: createTimerSession,
  },
  analytics: {
    get: getTimerAnalytics,
  },
}
