export const Orb = ({ className }: { className?: string }) => {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none opacity-10 dark:opacity-20 animate-pulse ${className}`}
    />
  )
}
