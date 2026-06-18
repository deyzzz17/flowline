import { Navbar } from '@/components/home/navbar'
import { HeroSection } from '@/components/home/hero-section'
import { ProblemSection } from '@/components/home/problem-section'
import { PillarsSection } from '@/components/home/pillars-section'
import { DemoSection } from '@/components/home/demo-section'
import { RoadmapSection } from '@/components/home/roadmap-section'
import { FinalCtaSection } from '@/components/home/final-cta-section'
import { Footer } from '@/components/home/footer'
import { requireGuest } from '@/lib/require-auth'

export default async function HomePage() {
  await requireGuest()

  return (
    <div className="relative min-h-screen bg-background text-slate-900 selection:bg-violet-200 dark:text-white dark:selection:bg-violet-500/30">
      <Navbar />
      <div className="relative z-10">
        <HeroSection />
        <ProblemSection />
        <PillarsSection />
        <DemoSection />
        <RoadmapSection />
        <FinalCtaSection />
      </div>
      <Footer />
    </div>
  )
}
