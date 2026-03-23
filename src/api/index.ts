import { authAPI } from './authentification'
import { profileAPI } from './profile'
import { tasksAPI } from './tasks'

export const api = {
  tasks: tasksAPI,
  authentifications: authAPI,
  profile: profileAPI,
}
