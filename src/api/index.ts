import { authAPI } from './authentification'
import { tasksAPI } from './tasks'

export const api = {
  tasks: tasksAPI,
  authentifications: authAPI,
}
