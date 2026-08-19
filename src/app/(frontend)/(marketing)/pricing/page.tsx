import type { Metadata } from 'next'
import { SectionLabel } from '@/components/home/section-label'
import { PricingClient } from '@/components/billing/pricing-client'
import { Footer } from '@/components/home/footer'
import { Orb } from '@/components/home/orb'

export const metadata: Metadata = {
  title: 'Pricing — Flowline',
  description: 'Plans that grow with your flow. Start for free, upgrade when you need more.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-slate-900 selection:bg-violet-200 dark:text-white dark:selection:bg-violet-500/30">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 z-0 dark:hidden"
          style={{
            backgroundImage: `linear-gradient(to right,rgba(109,40,217,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(109,40,217,0.04) 1px,transparent 1px)`,
            backgroundSize: '72px 72px',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 hidden dark:block"
          style={{
            backgroundImage: `linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)`,
            backgroundSize: '72px 72px',
          }}
        />

        <Orb className="h-150 w-150 bg-violet-400 -top-48 -left-48" />
        <Orb className="h-100 w-100 bg-purple-400 top-1/3 -right-32" />

        <div className="relative z-10">
          <section className="mx-auto max-w-screen-2xl px-4 pt-16 pb-4 sm:px-6 lg:px-10 lg:pt-24">
            <div className="mx-auto max-w-2xl text-center">
              <SectionLabel>Pricing</SectionLabel>
              <h1 className="mb-4 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                Plans that grow with your flow.
              </h1>
              <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-white/60">
                Start for free, upgrade when you need more. Cancel anytime.
              </p>
            </div>

            <div className="mx-auto max-w-5xl">
              <PricingClient />
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  )
}
