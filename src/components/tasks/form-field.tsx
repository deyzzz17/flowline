import { AlertCircleIcon } from "lucide-react"

export const FormField = ({
  label,
  optional,
  error,
  children,
}: {
  label: string
  optional?: boolean
  error?: string
  children: React.ReactNode
}) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-foreground">
        {label}
        {optional && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span>
        )}
      </label>
      {error && (
        <p className="flex items-center gap-1 text-xs font-semibold text-destructive animate-in fade-in slide-in-from-right-1">
          <AlertCircleIcon size={12} />
          {error}
        </p>
      )}
    </div>
    {children}
  </div>
)
