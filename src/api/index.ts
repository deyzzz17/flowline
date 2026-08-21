import { authAPI } from './authentification'
import { listsAPI } from './lists'
import { profileAPI } from './profile'
import { tagsAPI } from './tags'
import { tasksAPI } from './tasks'
import { timerAPI } from './timer'
import { calendarAPI } from './calendar'
import { listMembersAPI } from './list-members'
import { taskCommentsAPI } from './task-comments'

export const api = {
  tasks: tasksAPI,
  authentifications: authAPI,
  profile: profileAPI,
  tags: tagsAPI,
  lists: listsAPI,
  timer: timerAPI,
  calendar: calendarAPI,
  listMembers: listMembersAPI,
  taskComments: taskCommentsAPI,
}
