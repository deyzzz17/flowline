'use client'

import { cn } from '@/lib/utils'

interface ContactAvatarProps {
  name: string
  image?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export function ContactAvatar({ name, image, size = 'md' }: ContactAvatarProps) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover', SIZE_CLASSES[size])}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-violet-500/10 font-semibold text-violet-600 dark:text-violet-400',
        SIZE_CLASSES[size],
      )}
    >
      {getInitial(name)}
    </div>
  )
}
