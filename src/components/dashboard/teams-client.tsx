import { UsersRound } from 'lucide-react'

// Placeholder while the actual Teams page (creating teams, membership,
// etc.) is still being designed — access-gating (Pro-only, unlimited) is
// already wired up in the page/route around this component.
export function TeamsClient() {
  return (
    <>
      <section className="mb-8 mt-10">
        <p className="mb-1 text-xl font-semibold uppercase text-violet-500 dark:text-violet-400">
          Workspace
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Teams</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Organize this workspace into teams.
        </p>
      </section>

      <div className="flex flex-col items-center justify-center rounded-3xl bg-card px-6 py-16 text-center shadow-lg shadow-black/5">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <UsersRound className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
        <p className="mt-1 text-xs text-muted-foreground/60">Team creation is on its way.</p>
      </div>
    </>
  )
}
