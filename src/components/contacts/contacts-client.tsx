'use client'

import { useState } from 'react'
import { Search, Send, Check, X, Users, Inbox, Clock, Loader2, UserCheck, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  useContactSearch,
  usePendingRequests,
  useContactsList,
  useRecentConnections,
} from '@/hooks/contacts/use-contacts'
import type { ContactsPageData } from '@/api/contacts/actions'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ContactAvatar({
  name,
  image,
  size = 'md',
}: {
  name: string
  image?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-10 w-10'
  return (
    <Avatar className={cn(sizeClass, 'shrink-0')}>
      <AvatarImage src={image ?? undefined} alt={name} />
      <AvatarFallback className="bg-violet-500/10 text-xs font-semibold text-violet-600 dark:text-violet-400">
        {name ? getInitials(name) : <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  )
}

function ContactsHeader({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="mb-6">
      <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
        Contacts
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Your network
        {pendingCount > 0 ? `, ${pendingCount} pending` : ''}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find people by email and manage your connections.
      </p>
    </div>
  )
}

function SearchSection() {
  const { email, setEmail, isValidEmail, isSearching, searchResult, sendRequest, isSending } =
    useContactSearch()

  const showResultArea = isValidEmail

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Search by email address..."
          className="w-full h-11 rounded-xl border border-border/60 bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-violet-500/40"
        />
      </div>

      {showResultArea && (
        <div className="mt-4">
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : searchResult ? (
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background p-3.5">
              <ContactAvatar name={searchResult.user.name} image={searchResult.user.image} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {searchResult.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{searchResult.user.email}</p>
              </div>
              {searchResult.relationship === 'none' && (
                <button
                  type="button"
                  onClick={() => sendRequest(searchResult.user.id)}
                  disabled={isSending}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50 shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send
                </button>
              )}
              {searchResult.relationship === 'pending_sent' && (
                <span className="flex items-center gap-1.5 rounded-xl bg-muted px-3.5 py-2 text-xs font-medium text-muted-foreground shrink-0">
                  <Clock className="h-3.5 w-3.5" />
                  Pending
                </span>
              )}
              {searchResult.relationship === 'pending_received' && (
                <span className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 shrink-0">
                  <Inbox className="h-3.5 w-3.5" />
                  Check requests
                </span>
              )}
              {searchResult.relationship === 'accepted' && (
                <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                  <UserCheck className="h-3.5 w-3.5" />
                  Connected
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Search className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No one found with this email</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RequestsSection({ initialData }: { initialData: ContactsPageData }) {
  const { received, accept, isAccepting, decline, isDeclining } = usePendingRequests(initialData)

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
        <Inbox className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Requests</p>
        {received.length > 0 && (
          <span className="ml-auto rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
            {received.length}
          </span>
        )}
      </div>

      {received.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm text-muted-foreground">No pending requests</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {received.map((req) => (
            <div key={req.connectionId} className="flex items-center gap-3 px-5 py-3.5">
              <ContactAvatar name={req.user.name} image={req.user.image} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{req.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{req.user.email}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => decline(req.connectionId)}
                  disabled={isDeclining || isAccepting}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => accept(req.connectionId)}
                  disabled={isDeclining || isAccepting}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentSection({ initialData }: { initialData: ContactsPageData }) {
  const { recent } = useRecentConnections(initialData)

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Recent</p>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm text-muted-foreground">Nothing recent yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {recent.map((item) => (
            <div key={item.connectionId} className="flex items-center gap-3 px-5 py-3.5">
              <ContactAvatar name={item.user.name} image={item.user.image} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  <span className="font-medium">{item.user.name}</span>
                  <span className="text-muted-foreground"> is now a connection</span>
                </p>
              </div>
              <span className="text-xs text-muted-foreground/60 shrink-0">{timeAgo(item.at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContactsSection({ initialData }: { initialData: ContactsPageData }) {
  const [expanded, setExpanded] = useState(true)
  const { contacts, total, hasMore, isLoading, showMore } = useContactsList(initialData)

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-5 py-4 transition-colors hover:bg-muted/30"
      >
        <Users className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Contacts ({total})</p>
        <span
          className={cn(
            'ml-auto text-muted-foreground/60 transition-transform',
            expanded ? 'rotate-180' : '',
          )}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <>
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 border-t border-border/50 py-8 text-center">
              <p className="text-sm text-muted-foreground">No contacts yet</p>
            </div>
          ) : (
            <div className="border-t border-border/50 divide-y divide-border/30">
              {contacts.map((contact) => (
                <div key={contact.connectionId} className="flex items-center gap-3 px-5 py-3.5">
                  <ContactAvatar name={contact.user.name} image={contact.user.image} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {contact.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{contact.user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="border-t border-border/50 p-3">
              <button
                type="button"
                onClick={showMore}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                View more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function ContactsClient({ initialData }: { initialData: ContactsPageData }) {
  return (
    <div>
      <ContactsHeader pendingCount={initialData.pendingReceived.length} />

      <div className="space-y-6">
        <SearchSection />
        <RequestsSection initialData={initialData} />
        <RecentSection initialData={initialData} />
        <ContactsSection initialData={initialData} />
      </div>
    </div>
  )
}
