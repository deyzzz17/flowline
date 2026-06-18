export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
    <span className="h-1 w-1 rounded-full bg-violet-500 dark:bg-violet-400" />
    {children}
  </p>
)
