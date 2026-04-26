'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare, Mail, BookOpen, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FeedbackDialog } from './feedback-dialog'

interface FaqItem {
  question: string
  answer: string
}

interface SupportClientProps {
  faqItems: FaqItem[]
}

export const SupportClient = ({ faqItems }: SupportClientProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i))

  return (
    <>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      <div className="mx-auto max-w-2xl mt-10 pb-16">
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-violet-500" />
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Support
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            How can we help you?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Find answers to common questions below, or reach out to us directly.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 text-left transition-all hover:bg-muted/60 hover:border-border"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <MessageSquare className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Send feedback</p>
              <p className="text-xs text-muted-foreground">Report a bug or suggest a feature</p>
            </div>
          </button>

          <a
            href="mailto:support@flowline.app"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 text-left transition-all hover:bg-muted/60 hover:border-border"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Mail className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Email us</p>
              <p className="text-xs text-muted-foreground">support@flowline.app</p>
            </div>
          </a>

          <a
            href="/docs"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 text-left transition-all hover:bg-muted/60 hover:border-border"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <BookOpen className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Documentation</p>
              <p className="text-xs text-muted-foreground">Browse the full docs</p>
            </div>
          </a>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Frequently asked questions
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Quick answers to questions you may have.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden divide-y divide-border/50">
          {faqItems.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                >
                  <span className={cn(
                    'text-sm font-medium transition-colors',
                    isOpen ? 'text-foreground' : 'text-foreground/80',
                  )}>
                    {item.question}
                  </span>
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  }
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-6 py-8 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10">
            <MessageSquare className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Still have questions?</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Can&apos;t find what you&apos;re looking for? We&apos;re here to help.
            </p>
          </div>
          <Button
            onClick={() => setFeedbackOpen(true)}
            className="mt-1 gap-2"
            variant="outline"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Contact us
          </Button>
        </div>
      </div>
    </>
  )
}