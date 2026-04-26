'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Send } from 'lucide-react'
import { useFeedback } from '@/hooks/support/use-feedback'

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const {
    subject,
    setSubject,
    message,
    setMessage,
    isLoading,
    error,
    isValid,
    handleClose,
    handleSubmit,
  } = useFeedback()

  const handleOpenChange = (v: boolean) => {
    if (!v) handleClose()
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-violet-500" />
            Send feedback
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="feedback-subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="feedback-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Bug report, Feature request..."
              className="h-11"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">
              Message <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or suggestion in detail..."
              className="w-full min-h-30 resize-none rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary/40 focus:ring-0 placeholder:text-muted-foreground"
            />
          </div>

          <DialogFooter className="pt-1">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
