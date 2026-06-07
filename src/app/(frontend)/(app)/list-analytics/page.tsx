import { getListAnalytics } from '@/api/list-analytics/actions'
import { ListAnalyticsClient } from '@/components/lists/list-analytics'
import { ProtectedRoute } from '@/components/route/protected-route'

export default async function ListAnalyticsPage() {
  const initialData = await getListAnalytics('week', 0)
  return (
    <ProtectedRoute>
      <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
        <ListAnalyticsClient initialData={initialData} />
      </div>
    </ProtectedRoute>
  )
}
