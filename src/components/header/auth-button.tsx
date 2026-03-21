'use client'

import { useManageAuth } from '@/hooks/header/use-manage-auth'
import Link from 'next/link'

export function AuthButtons() {
  const { open, change } = useManageAuth()

  return (
    <div className="relative flex items-center gap-2 sm:gap-3">
      <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
      <Link
        href="/sign-in"
        className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground sm:block"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="group relative hidden overflow-hidden rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-500/20 transition-all duration-200 hover:bg-violet-500 hover:shadow-md hover:shadow-violet-500/30 hover:-translate-y-px active:translate-y-0 sm:inline-flex items-center gap-1.5"
      >
        <span>Sign up</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
        <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
      </Link>

      <button
        onClick={change}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent sm:hidden"
        aria-label="Menu"
      >
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur-md sm:hidden">
          <div className="p-2 flex flex-col gap-1">
            <button className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent">
              Sign in
            </button>
            <button className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-left text-sm font-semibold text-white transition-colors hover:bg-violet-500">
              Sign up
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
