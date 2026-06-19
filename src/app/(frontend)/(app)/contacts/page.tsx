import { ContactsClient } from '@/components/contacts/contacts-client'
import { requireAuth } from '@/lib/require-auth'

export default async function ContactsPage() {
  await requireAuth()

  return (
    <div className="relative px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <ContactsClient />
    </div>
  )
}
