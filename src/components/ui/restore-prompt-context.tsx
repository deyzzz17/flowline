'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { RestoreArchivedPrompt, type RestorableItem } from './restore-archived-prompt'

interface RestorePromptConfig {
  title: string
  description: string
  items: RestorableItem[]
  onRestore: (id: number) => Promise<{ ok: boolean; error?: string }>
}

interface RestorePromptContextValue {
  openPrompt: (config: RestorePromptConfig) => void
}

const RestorePromptContext = createContext<RestorePromptContextValue | null>(null)

export function RestorePromptProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RestorePromptConfig | null>(null)

  const openPrompt = useCallback((newConfig: RestorePromptConfig) => {
    setConfig(newConfig)
  }, [])

  return (
    <RestorePromptContext.Provider value={{ openPrompt }}>
      {children}
      {config && (
        <RestoreArchivedPrompt
          open={!!config}
          onOpenChange={(v) => {
            if (!v) setConfig(null)
          }}
          title={config.title}
          description={config.description}
          items={config.items}
          onRestore={config.onRestore}
        />
      )}
    </RestorePromptContext.Provider>
  )
}

export function useRestorePrompt() {
  const ctx = useContext(RestorePromptContext)
  if (!ctx) {
    throw new Error('useRestorePrompt must be used within a RestorePromptProvider')
  }
  return ctx
}
