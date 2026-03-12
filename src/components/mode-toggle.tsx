'use client'

import * as React from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-9 h-9 focus-visible:ring-0 focus-visible:ring-offset-0 relative"
        >
          <SunIcon
            className="h-5 w-5 transition-all scale-100 rotate-0 dark:scale-0 dark:rotate-90 text-black dark:text-transparent"
            style={{ strokeWidth: '2px' }}
          />
          <MoonIcon
            className="absolute h-5 w-5 transition-all scale-0 -rotate-90 dark:scale-100 dark:rotate-0 text-transparent dark:text-white"
            style={{ strokeWidth: '2px' }}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
