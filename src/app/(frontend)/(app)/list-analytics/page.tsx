import { getListAnalytics } from '@/api/list-analytics/actions'
import { ListAnalyticsClient } from '@/components/lists/list-analytics'
import { requireAuth } from '@/lib/require-auth'

export default async function ListAnalyticsPage() {
  const [, initialData] = await Promise.all([
    requireAuth(),
    getListAnalytics('week', 0),
  ])

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <ListAnalyticsClient initialData={initialData} />
    </div>
  )
}