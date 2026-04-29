import {
  listTimerCategories,
  createTimerCategory,
  deleteTimerCategory,
  createTimerSession,
  getTimerAnalytics,
  listTimerConfigs,
  saveTimerConfig,
  deleteTimerConfig,
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
  configs: {
    list: listTimerConfigs,
    save: saveTimerConfig,
    delete: deleteTimerConfig,
  },
}
