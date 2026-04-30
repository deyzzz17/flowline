import { useTaskSessions } from "@/hooks/timer/use-task-sessions"
import { Timer } from "lucide-react"

export function TaskSessionsBadge({ taskId }: { taskId: number }) {
  const { totalSessions, focusTime, totalSeconds, isLoading } = useTaskSessions(taskId)

  if (isLoading || totalSeconds === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 rounded-full border border-border/40 bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        <Timer className="h-2.5 w-2.5 shrink-0" />
        {totalSessions} session{totalSessions > 1 ? 's' : ''}
      </span>
      <span className="flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/5 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
        {focusTime} focused
      </span>
    </div>
  )
}
