'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Check, X } from 'lucide-react'
import { useGoogleCalendar } from '@/hooks/calendar/use-google-calendar'
import { useCalendarFilter } from '@/components/calendar/calendar-filter-context'
import { cn } from '@/lib/utils'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// Vue connectée extraite pour permettre le pattern key + useState sans useEffect
function ConnectedView({
  open,
  onOpenChange,
  calendars,
  disconnect,
  updateSettings,
  isDisconnecting,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  calendars: any[]
  disconnect: any
  updateSettings: any
  isDisconnecting: boolean
}) {
  const { toggleGoogleCalendar, isGoogleCalendarVisible } = useCalendarFilter()

  // Initialisé une seule fois à la création — pas de useEffect
  const [localCalendars, setLocalCalendars] = useState<any[]>(calendars)

  const handleToggle = (googleId: string) => {
    const current = localCalendars.find((c) => c.googleId === googleId)
    if (!current) return
    const newEnabled = !current.enabled

    // 1. Mise à jour locale immédiate (toggle dialog)
    setLocalCalendars((prev) =>
      prev.map((c) => (c.googleId === googleId ? { ...c, enabled: newEnabled } : c)),
    )

    // 2. Mise à jour du filtre calendrier immédiate (affichage events)
    const currentlyVisible = isGoogleCalendarVisible(googleId)
    if (newEnabled !== currentlyVisible) {
      toggleGoogleCalendar(googleId)
    }

    // 3. Envoi serveur avec rollback si erreur
    updateSettings([{ googleId, enabled: newEnabled }], {
      onError: () => {
        // Rollback dialog
        setLocalCalendars((prev) =>
          prev.map((c) => (c.googleId === googleId ? { ...c, enabled: !newEnabled } : c)),
        )
        // Rollback filtre
        toggleGoogleCalendar(googleId)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <GoogleIcon className="h-5 w-5" />
            Google Calendar
          </DialogTitle>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Connected
            </span>
          </div>

          {localCalendars.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Your calendars
              </p>
              <div className="space-y-1">
                {localCalendars.map((cal: any) => (
                  <button
                    key={cal.googleId}
                    type="button"
                    onClick={() => handleToggle(cal.googleId)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border/50 px-3 py-2 text-left transition-all hover:bg-muted/40"
                  >
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cal.color }}
                    />
                    <span className="flex-1 text-sm truncate">{cal.name}</span>
                    {cal.primary && (
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">primary</span>
                    )}
                    <div
                      className={cn(
                        'relative h-4 w-7 rounded-full transition-colors shrink-0',
                        cal.enabled ? 'bg-violet-500' : 'bg-muted-foreground/30',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform',
                          cal.enabled ? 'translate-x-3' : 'translate-x-0',
                        )}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bouton disconnect toujours visible en bas */}
        <div className="shrink-0 pt-2 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
            onClick={() => disconnect(undefined, { onSuccess: () => onOpenChange(false) })}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <X className="h-3.5 w-3.5" />
                Disconnect Google Calendar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface GoogleCalendarDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function GoogleCalendarDialog({ open, onOpenChange }: GoogleCalendarDialogProps) {
  const {
    isConnected,
    calendars,
    connect,
    disconnect,
    updateSettings,
    isConnecting,
    isDisconnecting,
  } = useGoogleCalendar()

  if (!isConnected) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GoogleIcon className="h-5 w-5" />
              Connect Google Calendar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              View your Google Calendar events directly in Flowline. Read-only, Flowline won&apos;t
              modify your Google events.
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {[
                'View all your Google Calendar events',
                'Always up to date — no sync delay',
                "Read-only — Flowline won't modify your Google events",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <Button
              className="w-full gap-2"
              onClick={() => connect(undefined)}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <GoogleIcon className="h-4 w-4" />
                  Connect Google Calendar
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground/60 text-center">
              You need to be signed in with Google to use this feature.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // key force le remontage à chaque ouverture → useState réinitialisé avec données fraîches
  return (
    <ConnectedView
      key={open ? 'open' : 'closed'}
      open={open}
      onOpenChange={onOpenChange}
      calendars={calendars}
      disconnect={disconnect}
      updateSettings={updateSettings}
      isDisconnecting={isDisconnecting}
    />
  )
}
