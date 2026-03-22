import { Task } from '@/payload-types'

export type TasksPage = {
  docs: Task[]
  hasNextPage: boolean
  nextPage: number | null
  totalDocs: number
}
