import { HeroSection } from '@/components/home/hero-section'
import { PillarsSection } from '@/components/home/pillars-section'
import { OnboardingSection } from '@/components/home/onboarding-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { FinalCtaSection } from '@/components/home/final-cta-section'
import { Footer } from '@/components/home/footer'
import { Orb } from '@/components/home/orb'
import { requireGuest } from '@/lib/require-auth'

export default async function HomePage() {
  await requireGuest()

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-slate-900 selection:bg-violet-200 dark:text-white dark:selection:bg-violet-500/30">
      <div
        className="pointer-events-none fixed inset-0 z-0 dark:hidden"
        style={{
          backgroundImage: `linear-gradient(to right,rgba(109,40,217,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(109,40,217,0.04) 1px,transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />

      <Orb className="h-150 w-150 bg-violet-400 -top-48 -left-48" />
      <Orb className="h-100 w-100 bg-purple-400 top-1/3 -right-32" />
      <Orb className="h-125 w-125 bg-indigo-400 bottom-0 left-1/3" />

      <div className="relative z-10">
        <HeroSection />
        <PillarsSection />
        <OnboardingSection />
        <TestimonialsSection />
        <FinalCtaSection />
      </div>
      <Footer />
    </div>
  )
}
