import { authAPI } from './authentification'
import { profileAPI } from './profile'
import { tagsAPI } from './tags'
import { tasksAPI } from './tasks'

export const api = {
  tasks: tasksAPI,
  authentifications: authAPI,
  profile: profileAPI,
  tags: tagsAPI,
}
