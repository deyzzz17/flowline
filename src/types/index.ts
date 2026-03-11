export type Task = {
  id: string
  title: string
  description?: string
  status: 'active' | 'completed'
}
