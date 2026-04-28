import { authAPI } from './authentification'
import { listsAPI } from './lists'
import { profileAPI } from './profile'
import { tagsAPI } from './tags'
import { tasksAPI } from './tasks'
import { timerAPI } from './timer'
import { calendarAPI } from './calendar'

export const api = {
  tasks: tasksAPI,
  authentifications: authAPI,
  profile: profileAPI,
  tags: tagsAPI,
  lists: listsAPI,
  timer: timerAPI,
  calendar: calendarAPI,
}
