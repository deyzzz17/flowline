import { getListAnalytics } from '@/api/list-analytics/actions'
import { ListAnalyticsClient } from '@/components/lists/list-analytics'

export default async function ListAnalyticsPage() {
  const initialData = await getListAnalytics('week', 0)
  return <ListAnalyticsClient initialData={initialData} />
}
