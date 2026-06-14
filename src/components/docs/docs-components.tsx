import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function DocPageHeader({
  badge,
  title,
  description,
}: {
  badge?: string
  title: string
  description: string
}) {
  return (
    <div className="mb-10 pb-8 border-b border-border/60">
      {badge && (
        <span className="mb-3 inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
          {badge}
        </span>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">{title}</h1>
      <p className="text-lg text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

export function DocSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-20">
      <h2 className="text-xl font-semibold text-foreground mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function DocSubSection({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div id={id} className="mb-6 scroll-mt-20">
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

// ── Prose ─────────────────────────────────────────────────────────────────────

export function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-muted-foreground leading-relaxed', className)}>{children}</p>
  )
}

// ── Callout ───────────────────────────────────────────────────────────────────

export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'tip' | 'warning'
  title?: string
  children: React.ReactNode
}) {
  const styles = {
    info: 'bg-blue-500/8 border-blue-500/20 text-blue-700 dark:text-blue-300',
    tip: 'bg-emerald-500/8 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    warning: 'bg-amber-500/8 border-amber-500/20 text-amber-700 dark:text-amber-300',
  }
  return (
    <div className={cn('rounded-xl border px-4 py-3.5', styles[type])}>
      {title && <p className="text-xs font-semibold uppercase tracking-wide mb-1">{title}</p>}
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  )
}

// ── Step list ─────────────────────────────────────────────────────────────────

export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-4">{children}</ol>
}

export function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[11px] font-bold text-violet-600 dark:text-violet-400 mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </li>
  )
}

export function FeatureGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
        <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

export function DocNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}

export function PropTable({
  rows,
}: {
  rows: { name: string; description: string; note?: string }[]
}) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Option
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="px-4 py-2.5 font-mono text-xs font-medium text-violet-600 dark:text-violet-400 whitespace-nowrap">
                {row.name}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                {row.description}
                {row.note && <span className="ml-1.5 text-muted-foreground/50">{row.note}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
