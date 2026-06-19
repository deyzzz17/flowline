import { getContactsPageData } from '@/api/contacts/actions'
import { ContactsClient } from '@/components/contacts/contacts-client'
import { requireAuth } from '@/lib/require-auth'

export default async function ContactsPage() {
  const [, initialData] = await Promise.all([requireAuth(), getContactsPageData()])

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <ContactsClient initialData={initialData} />
    </div>
  )
}
