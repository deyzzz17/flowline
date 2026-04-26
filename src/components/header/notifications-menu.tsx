'use client'

import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/header/use-notifications'
import { useRouter, usePathname } from 'next/navigation'
import { format } from 'date-fns'

function highlightTask(taskId: number) {
  const el = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement | null
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('mention-highlighted')
  setTimeout(() => el.classList.remove('mention-highlighted'), 3000)
}

export const NotificationsMenu = () => {
  const { open, setOpen, notifications, hasUnread, count } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()

  const handleNotifClick = (taskId: number, listSlug: string) => {
    setOpen(false)
    const targetPath = `/lists/${listSlug}`
    const isSamePage = pathname === targetPath

    if (isSamePage) {
      highlightTask(taskId)
    } else {
      router.push(targetPath)
      setTimeout(() => highlightTask(taskId), 700)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-background" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 rounded-xl overflow-hidden" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Notifications</p>
          </div>
          {count > 0 && (
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              {count}
            </span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
              <Bell className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">All clear</p>
            <p className="text-xs text-muted-foreground/60">No tasks expiring soon.</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => handleNotifClick(notif.taskId, notif.listSlug)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <div
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: notif.listColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {notif.taskTitle}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                    {notif.listName}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        notif.level === 'urgent'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-orange-500/10 text-orange-500 dark:text-orange-400',
                      )}
                    >
                      {notif.message}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {format(new Date(notif.dueDate), 'MMM d')}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
