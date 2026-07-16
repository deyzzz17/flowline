import { useQuery } from '@tanstack/react-query'
import { getMyPlanLimits } from '@/api/plan/actions'

export function usePlanLimits() {
  const { data } = useQuery({
    queryKey: ['plan-limits'],
    queryFn: () => getMyPlanLimits(),
    staleTime: 5 * 60 * 1000,
  })
  return data
}
