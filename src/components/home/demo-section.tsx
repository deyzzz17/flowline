import { PlayIcon } from '@heroicons/react/24/outline'
import { SectionLabel } from '@/components/home/section-label'
import { Reveal } from '@/components/home/reveal'

const Placeholder = ({ label }: { label: string }) => (
  <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.02]">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
      <PlayIcon className="h-6 w-6" />
    </div>
    <p className="text-sm font-medium text-slate-400 dark:text-white/30">{label}</p>
  </div>
)

export const DemoSection = () => {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <Reveal>
          <SectionLabel>See it in action</SectionLabel>
        </Reveal>
        <Reveal delay={50}>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            From task to focus, in seconds.
          </h2>
        </Reveal>
      </div>

      <video
        className="aspect-video w-full rounded-2xl object-cover dark:hidden"
        autoPlay
        loop
        muted
        playsInline
        poster="/demo-light-poster.png"
      >
        <source src="/demo-light.webm" type="video/webm" />
        <source src="/demo-light.mp4" type="video/mp4" />
      </video>
      <video
        className="hidden aspect-video w-full rounded-2xl object-cover dark:block"
        autoPlay
        loop
        muted
        playsInline
        poster="/demo-dark-poster.png"
      >
        <source src="/demo-dark.webm" type="video/webm" />
        <source src="/demo-dark.mp4" type="video/mp4" />
      </video>
    </section>
  )
}
