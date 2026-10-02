import { Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanFeature } from './plans-config'

export const planFeatureLabel = (feature: PlanFeature) =>
  typeof feature === 'string' ? feature : feature.label

// One line of a plan card's feature list, shared by the public pricing page
// and the signed-in billing page. Features announced but not built yet are
// greyed out with a "Coming soon" badge instead of a check mark.
export function PlanFeatureItem({
  feature,
  checkClassName,
}: {
  feature: PlanFeature
  checkClassName?: string
}) {
  const comingSoon = typeof feature !== 'string' && feature.comingSoon

  return (
    <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
      {comingSoon ? (
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
      ) : (
        <Check className={cn('mt-0.5 h-4 w-4 shrink-0', checkClassName)} />
      )}
      <span
        className={cn(
          'flex flex-wrap items-center gap-x-1.5 gap-y-1',
          comingSoon && 'text-muted-foreground/70',
        )}
      >
        {planFeatureLabel(feature)}
        {comingSoon && (
          <span className="rounded-full border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
            Coming soon
          </span>
        )}
      </span>
    </li>
  )
}
