import {
  listTimerCategories,
  createTimerCategory,
  deleteTimerCategory,
  createTimerSession,
  getTimerAnalytics,
  listTimerConfigs,
  saveTimerConfig,
  deleteTimerConfig,
  getTaskSessions,
} from './actions'

export const timerAPI = {
  categories: {
    list: listTimerCategories,
    create: createTimerCategory,
    delete: deleteTimerCategory,
  },
  sessions: {
    create: createTimerSession,
    getTasks: getTaskSessions,
  },
  analytics: {
    get: getTimerAnalytics,
  },
  configs: {
    list: listTimerConfigs,
    save: saveTimerConfig,
    delete: deleteTimerConfig,
  },
}
