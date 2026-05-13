import {
  listTimerCategories,
  createTimerCategory,
  deleteTimerCategory,
  createTimerSession,
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
  configs: {
    list: listTimerConfigs,
    save: saveTimerConfig,
    delete: deleteTimerConfig,
  },
}
