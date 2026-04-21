import { api } from '@/api'
import { Task } from '@/payload-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useSoftDelete = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.tasks.softDelete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const queries = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
      const previousData = queries.map(([queryKey, data]) => ({ queryKey, data }))

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) => {
          if (!old) return old
          return {
            ...old,
            docs: old.docs.map((task) => (task.id === id ? { ...task, status: 'deleted' } : task)),
          }
        })
      })

      return { previousData }
    },
    onError: (_err, _vars, context) => {
      context?.previousData?.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey as string[], data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
