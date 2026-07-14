import { getBillingInfo } from '@/api/billing/actions'
import { BillingClient } from '@/components/billing/billing-client'
import { requireAuth } from '@/lib/require-auth'

export default async function BillingPage() {
  const [, billing] = await Promise.all([requireAuth(), getBillingInfo()])

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <BillingClient billing={billing} />
    </div>
  )
}