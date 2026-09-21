import Link from 'next/link'
import { UsersRound, Zap } from 'lucide-react'

export function TeamsUpgradePrompt() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-card px-6 py-16 text-center shadow-lg shadow-black/5">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
        <UsersRound className="h-6 w-6 text-violet-500" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">Teams is a Pro feature</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Organize this workspace into as many teams as you need — unlimited on Pro. Upgrade to
        start creating them.
      </p>
      <Link
        href="/billing"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
      >
        <Zap className="h-3.5 w-3.5" />
        Upgrade to Pro
      </Link>
    </div>
  )
}
