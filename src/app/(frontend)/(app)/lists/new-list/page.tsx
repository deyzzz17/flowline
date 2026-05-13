import { NewListClient } from '@/components/lists/new-list-client'
import { ProtectedRoute } from '@/components/route/protected-route'

export default async function NewListPage() {
  return (
    <ProtectedRoute>
      <div className="relative mx-auto px-4 pb-16 sm:px-6 lg:px-10">
        <div className="relative z-10">
          <NewListClient />
        </div>
      </div>
    </ProtectedRoute>
  )
}
