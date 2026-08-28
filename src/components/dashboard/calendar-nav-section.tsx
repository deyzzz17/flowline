'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Flame,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCalendarCategories } from '@/hooks/calendar/use-calendar-categories'
import { useCalendarFilter } from '../calendar/calendar-filter-context'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import { useRestorePrompt } from '@/components/ui/restore-prompt-context'
import {
  listPlanArchivedCalendarCategories,
  restoreArchivedCalendarCategory,
  type CalendarScope,
} from '@/api/calendar/actions'
import { cn } from '@/lib/utils'
import {
  LIMIT_ERRORS,
  SAFETY_CAP_ERRORS,
  isPlanUnlimited,
  type LimitError,
  type SafetyCapError,
} from '@/lib/plan-limits'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PlanLimitDialog } from '../ui/plan-limit-dialog'
import { SafetyCapDialog } from '../ui/safety-cap-dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'

const PRESET_COLORS = [
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
  '#14b8a6',
]

const FALLBACK_CALENDAR_CATEGORIES_LIMIT = 20

function useCalendarNavState(scope: CalendarScope) {
  const { categories, createMutation, updateMutation, deleteMutation } =
    useCalendarCategories(scope)
  const { hiddenCategories, toggleCategory, habitsVisible, toggleHabits } = useCalendarFilter()
  const planLimits = usePlanLimits()
  const { openPrompt } = useRestorePrompt()
  const queryClient = useQueryClient()
  const categoriesLimit =
    planLimits?.limits.calendarCategories ?? FALLBACK_CALENDAR_CATEGORIES_LIMIT

  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#8b5cf6')
  const [editingCategory, setEditingCategory] = useState<{
    id: number
    name: string
    color: string
  } | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#8b5cf6')
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [limitDialog, setLimitDialog] = useState<LimitError | null>(null)
  const [capDialog, setCapDialog] = useState<SafetyCapError | null>(null)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    if (categories.length >= categoriesLimit) {
      if (planLimits && isPlanUnlimited(planLimits.plan, 'calendarCategories')) {
        setCapDialog(SAFETY_CAP_ERRORS.CALENDAR_CATEGORIES_CAP)
      } else {
        setLimitDialog(LIMIT_ERRORS.CALENDAR_CATEGORIES_LIMIT)
      }
      return
    }

    const result = await createMutation.mutateAsync({
      name: newCategoryName.trim(),
      color: newCategoryColor,
    })

    if (result && typeof result === 'object' && 'ok' in result && !result.ok) {
      if (result.error === LIMIT_ERRORS.CALENDAR_CATEGORIES_LIMIT) {
        setLimitDialog(LIMIT_ERRORS.CALENDAR_CATEGORIES_LIMIT)
        return
      }
      if (result.error === SAFETY_CAP_ERRORS.CALENDAR_CATEGORIES_CAP) {
        setCapDialog(SAFETY_CAP_ERRORS.CALENDAR_CATEGORIES_CAP)
        return
      }
    }

    setNewCategoryName('')
    setNewCategoryColor('#8b5cf6')
    setShowNewCategory(false)
  }

  const handleStartEdit = (cat: { id: number; name: string; color: string }) => {
    setEditingCategory(cat)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  const handleSaveEdit = async () => {
    if (!editingCategory || !editName.trim()) return
    await updateMutation.mutateAsync({
      id: editingCategory.id,
      data: { name: editName.trim(), color: editColor },
    })
    setEditingCategory(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)

    const { docs: archived } = await listPlanArchivedCalendarCategories()
    if (archived.length === 0) return

    const activeCount = Math.max(0, categories.length - 1)
    const room =
      planLimits && isPlanUnlimited(planLimits.plan, 'calendarCategories')
        ? archived.length
        : Math.max(0, categoriesLimit - activeCount)

    if (room <= 0) return

    openPrompt({
      title: 'Restore an archived category?',
      description:
        'You have calendar categories that were archived when your plan changed. Restore some now that you have room.',
      items: archived.map((c) => ({ id: c.id, label: c.name, color: c.color })),
      maxSelectable: room,
      onConfirm: async (ids) => {
        const results = await Promise.all(ids.map((id) => restoreArchivedCalendarCategory(id)))
        const allOk = results.every((r) => r.ok)

        queryClient.invalidateQueries({ queryKey: ['calendar-categories'] })

        if (allOk) {
          toast.info(ids.length > 1 ? 'Categories restored' : 'Category restored')
        } else {
          toast.error('Some categories could not be restored', {
            description: 'Please try again.',
          })
        }

        return { ok: allOk }
      },
    })
  }

  return {
    categories,
    hiddenCategories,
    toggleCategory,
    habitsVisible,
    toggleHabits,
    showNewCategory,
    setShowNewCategory,
    newCategoryName,
    setNewCategoryName,
    newCategoryColor,
    setNewCategoryColor,
    editingCategory,
    setEditingCategory,
    editName,
    setEditName,
    editColor,
    setEditColor,
    deleteTarget,
    setDeleteTarget,
    limitDialog,
    setLimitDialog,
    capDialog,
    setCapDialog,
    createMutation,
    updateMutation,
    handleCreateCategory,
    handleStartEdit,
    handleSaveEdit,
    handleConfirmDelete,
  }
}

type CalendarNavState = ReturnType<typeof useCalendarNavState>

function CalendarCategoryDialogs({ s }: { s: CalendarNavState }) {
  return (
    <>
      {s.editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-80 rounded-2xl border border-border/60 bg-background p-5 shadow-xl space-y-4">
            <p className="text-sm font-semibold text-foreground">Edit category</p>
            <input
              autoFocus
              value={s.editName}
              onChange={(e) => s.setEditName(e.target.value)}
              placeholder="Category name..."
              className="w-full h-9 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') s.handleSaveEdit()
              }}
            />
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Color
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => s.setEditColor(c)}
                    className="h-6 w-6 rounded-full transition-all hover:scale-110"
                    style={{
                      backgroundColor: c,
                      ...(s.editColor === c && {
                        outline: `2px solid ${c}`,
                        outlineOffset: '2px',
                      }),
                    }}
                  />
                ))}
                <div className="relative">
                  <div
                    className="h-6 w-6 rounded-full border-2 border-dashed border-border/60 cursor-pointer"
                    style={{
                      backgroundColor: PRESET_COLORS.includes(s.editColor)
                        ? 'transparent'
                        : s.editColor,
                    }}
                  />
                  <input
                    type="color"
                    value={s.editColor}
                    onChange={(e) => s.setEditColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={s.handleSaveEdit}
                disabled={!s.editName.trim() || s.updateMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background disabled:opacity-40"
              >
                {s.updateMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Save
              </button>
              <button
                type="button"
                onClick={() => s.setEditingCategory(null)}
                className="rounded-xl border border-border/60 px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!s.deleteTarget}
        onOpenChange={(v) => {
          if (!v) s.setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{s.deleteTarget?.name}</strong> and all
              calendar events associated with it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={s.handleConfirmDelete} variant="destructive">
              Delete category & events
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlanLimitDialog
        open={!!s.limitDialog}
        onOpenChange={(v) => {
          if (!v) s.setLimitDialog(null)
        }}
        limitError={s.limitDialog}
      />
      <SafetyCapDialog
        open={!!s.capDialog}
        onOpenChange={(v) => {
          if (!v) s.setCapDialog(null)
        }}
        capError={s.capDialog}
      />
    </>
  )
}

interface CalendarNavSectionProps {
  scope: CalendarScope
  href: string
  label: string
  onNavigate?: () => void
}

/** Mobile drawer variant — plain buttons/links, matches SidebarNavContent's style. */
export function CalendarNavSection({ scope, href, label, onNavigate }: CalendarNavSectionProps) {
  const pathname = usePathname()
  const isActive = (h: string) => pathname === h
  const navLink = (h: string) => ({ href: h, onClick: onNavigate })
  const [open, setOpen] = useState(false)
  const s = useCalendarNavState(scope)

  return (
    <>
      <CalendarCategoryDialogs s={s} />
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {label}
          </div>
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        {open && (
          <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border/50 pl-3">
            <Link
              {...navLink(href)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                isActive(href)
                  ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              Open calendar
            </Link>
            <div className="my-1.5 border-t border-border/40" />

            {scope === 'global' && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-muted/40 transition-colors">
                <button
                  type="button"
                  onClick={s.toggleHabits}
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                    s.habitsVisible ? 'border-transparent' : 'border-border/60 bg-background',
                  )}
                  style={
                    s.habitsVisible
                      ? { backgroundColor: '#f97316', borderColor: '#f97316' }
                      : undefined
                  }
                >
                  {s.habitsVisible && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </button>
                <Flame className="h-3 w-3 text-orange-500 shrink-0" />
                <span
                  className={cn(
                    'flex-1 truncate text-xs font-medium',
                    s.habitsVisible ? 'text-foreground' : 'text-muted-foreground/50',
                  )}
                >
                  Habits
                </span>
              </div>
            )}

            {s.categories.map((cat) => {
              const isVisible = !s.hiddenCategories.has(cat.id)
              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 group/cat hover:bg-muted/40 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => s.toggleCategory(cat.id)}
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                      isVisible ? 'border-transparent' : 'border-border/60 bg-background',
                    )}
                    style={
                      isVisible ? { backgroundColor: cat.color, borderColor: cat.color } : undefined
                    }
                  >
                    {isVisible && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </button>
                  <span
                    className={cn(
                      'flex-1 truncate text-xs font-medium',
                      isVisible ? 'text-foreground' : 'text-muted-foreground/50',
                    )}
                  >
                    {cat.name}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="opacity-100 sm:opacity-0 sm:group-hover/cat:opacity-100 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right" className="w-36">
                      <DropdownMenuItem
                        onClick={() => s.handleStartEdit(cat)}
                        className="gap-2 text-xs cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => s.setDeleteTarget({ id: cat.id, name: cat.name })}
                        className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}

            {s.showNewCategory ? (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5 space-y-2 mt-1">
                <input
                  autoFocus
                  value={s.newCategoryName}
                  onChange={(e) => s.setNewCategoryName(e.target.value)}
                  placeholder="Category name..."
                  className="w-full h-7 rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') s.handleCreateCategory()
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => s.setNewCategoryColor(c)}
                      className="h-4 w-4 rounded-full transition-all hover:scale-110"
                      style={{
                        backgroundColor: c,
                        ...(s.newCategoryColor === c && {
                          outline: `2px solid ${c}`,
                          outlineOffset: '2px',
                        }),
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={s.handleCreateCategory}
                    disabled={!s.newCategoryName.trim() || s.createMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-foreground px-2 py-1 text-[10px] font-semibold text-background disabled:opacity-40"
                  >
                    {s.createMutation.isPending ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <Check className="h-2.5 w-2.5" />
                    )}
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      s.setShowNewCategory(false)
                      s.setNewCategoryName('')
                    }}
                    className="rounded-lg border border-border/60 px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => s.setShowNewCategory(true)}
                className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-all"
              >
                <Plus className="h-3 w-3 shrink-0" />
                New calendar
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

/** Desktop sidebar variant — Collapsible + SidebarMenuSub primitives. */
export function SidebarCalendarNavSection({ scope, href, label }: CalendarNavSectionProps) {
  const pathname = usePathname()
  const isActive = (h: string) => pathname === h
  const { setOpenMobile, state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const nav = (h: string) => {
    setOpenMobile(false)
    return h
  }
  const [open, setOpen] = useState(false)
  const s = useCalendarNavState(scope)

  return (
    <>
      <CalendarCategoryDialogs s={s} />
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        asChild
        className={`group/calendar-${scope}`}
        disabled={isCollapsed}
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={label} className={cn(isCollapsed && 'pointer-events-none')}>
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              <ChevronDown
                className={cn('ml-auto h-3.5 w-3.5 transition-transform', !open && '-rotate-90')}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={isActive(href)}>
                  <Link href={nav(href)}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    Open calendar
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <div className="my-1.5 border-t border-border/40 mx-2" />

              {scope === 'global' && (
                <SidebarMenuSubItem>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-sidebar-accent transition-colors">
                    <button
                      type="button"
                      onClick={s.toggleHabits}
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                        s.habitsVisible ? 'border-transparent' : 'border-border/60 bg-background',
                      )}
                      style={
                        s.habitsVisible
                          ? { backgroundColor: '#f97316', borderColor: '#f97316' }
                          : undefined
                      }
                    >
                      {s.habitsVisible && (
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      )}
                    </button>
                    <Flame className="h-3 w-3 text-orange-500 shrink-0" />
                    <span
                      className={cn(
                        'flex-1 truncate text-xs font-medium',
                        s.habitsVisible ? 'text-foreground' : 'text-muted-foreground/50',
                      )}
                    >
                      Habits
                    </span>
                  </div>
                </SidebarMenuSubItem>
              )}

              {s.categories.map((cat) => {
                const isVisible = !s.hiddenCategories.has(cat.id)
                return (
                  <SidebarMenuSubItem key={cat.id}>
                    <div className="flex items-center gap-2 px-2 py-1 rounded-md group/cat hover:bg-sidebar-accent transition-colors">
                      <button
                        type="button"
                        onClick={() => s.toggleCategory(cat.id)}
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                          isVisible ? 'border-transparent' : 'border-border/60 bg-background',
                        )}
                        style={
                          isVisible
                            ? { backgroundColor: cat.color, borderColor: cat.color }
                            : undefined
                        }
                      >
                        {isVisible && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </button>
                      <span
                        className={cn(
                          'flex-1 truncate text-xs font-medium',
                          isVisible ? 'text-foreground' : 'text-muted-foreground/50',
                        )}
                      >
                        {cat.name}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="opacity-0 group-hover/cat:opacity-100 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right" className="w-36">
                          <DropdownMenuItem
                            onClick={() => s.handleStartEdit(cat)}
                            className="gap-2 text-xs cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => s.setDeleteTarget({ id: cat.id, name: cat.name })}
                            className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </SidebarMenuSubItem>
                )
              })}

              {s.showNewCategory ? (
                <SidebarMenuSubItem>
                  <div className="mx-2 rounded-xl border border-border/50 bg-muted/20 p-2.5 space-y-2">
                    <input
                      autoFocus
                      value={s.newCategoryName}
                      onChange={(e) => s.setNewCategoryName(e.target.value)}
                      placeholder="Category name..."
                      className="w-full h-7 rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') s.handleCreateCategory()
                      }}
                    />
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => s.setNewCategoryColor(c)}
                          className="h-4 w-4 rounded-full transition-all hover:scale-110"
                          style={{
                            backgroundColor: c,
                            ...(s.newCategoryColor === c && {
                              outline: `2px solid ${c}`,
                              outlineOffset: '2px',
                            }),
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={s.handleCreateCategory}
                        disabled={!s.newCategoryName.trim() || s.createMutation.isPending}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-foreground px-2 py-1 text-[10px] font-semibold text-background disabled:opacity-40"
                      >
                        {s.createMutation.isPending ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Check className="h-2.5 w-2.5" />
                        )}
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          s.setShowNewCategory(false)
                          s.setNewCategoryName('')
                        }}
                        className="rounded-lg border border-border/60 px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </SidebarMenuSubItem>
              ) : (
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    onClick={() => s.setShowNewCategory(true)}
                    className="text-muted-foreground/60"
                  >
                    <Plus className="h-3 w-3" />
                    New calendar
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </>
  )
}
