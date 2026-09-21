import { authAPI } from './authentification'
import { listsAPI } from './lists'
import { profileAPI } from './profile'
import { tagsAPI } from './tags'
import { tasksAPI } from './tasks'
import { timerAPI } from './timer'
import { calendarAPI } from './calendar'
import { listMembersAPI } from './list-members'
import { taskCommentsAPI } from './task-comments'
import { workspacesAPI } from './workspaces'
import { customRolesAPI } from './custom-roles'
import { teamsAPI } from './teams'

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
  workspaces: workspacesAPI,
  customRoles: customRolesAPI,
  teams: teamsAPI,
}
