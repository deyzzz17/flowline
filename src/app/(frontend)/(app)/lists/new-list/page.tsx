import { NewListClient } from '@/components/lists/new-list-client'
import { requireAuth } from '@/lib/require-auth'

export default async function NewListPage() {
  await requireAuth()

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <div className="relative z-10">
        <NewListClient />
      </div>
    </div>
  )
}
