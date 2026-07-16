'use server'

import 'server-only'
import { getUserPlanLimits } from '@/lib/get-user-plan'

export const getMyPlanLimits = async () => {
  const { plan, limits } = await getUserPlanLimits()
  return { plan, limits }
}
