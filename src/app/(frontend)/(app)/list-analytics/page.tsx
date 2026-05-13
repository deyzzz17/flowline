import { getListAnalytics } from '@/api/list-analytics/actions'
import { ListAnalyticsClient } from '@/components/lists/list-analytics'
import { ProtectedRoute } from '@/components/route/protected-route'

export default async function ListAnalyticsPage() {
  const initialData = await getListAnalytics('week', 0)
  return (
    <ProtectedRoute>
      <ListAnalyticsClient initialData={initialData} />
    </ProtectedRoute>
  )
}
