import { Zap, Crown } from 'lucide-react'
import type { Plan } from '@/lib/stripe'

export const PLANS_CONFIG = [
  {
    id: 'free' as Plan,
    name: 'Free',
    icon: null,
    price: { monthly: 0, annual: 0 },
    description: 'Get started with the essentials.',
    features: [
      'Up to 3 lists & 5 habits',
      'Up to 50 tasks per list',
      'Up to 20 subtasks per task',
      'Up to 10 custom tags',

      'Basic calendar',
      'Basic analytics (7-day history)',
      'Up to 10 saved timer presets',
      'Voice capture (5 commands/month)',
      'Limited collaboration access',
    ],
    accent: null,
    trialDays: null,
  },
  {
    id: 'plus' as Plan,
    name: 'Plus',
    icon: Zap,
    price: { monthly: 7, annual: 72 },
    description: 'For power users who want more.',
    features: [
      'Everything in Free',
      'AI Assistant',
      'Unlimited personal usage',
      'Shared lists (up to 3)',
      'Workspaces (up to 3, max 3 members)',
      'Task assignments & admin role',
      '6-month analytics history',
      'Up to 10 custom habit tracking fields',
      'Voice capture (50 commands/month)',
    ],
    accent: 'violet',
    trialDays: 14,
  },
  {
    id: 'pro' as Plan,
    name: 'Pro',
    icon: Crown,
    price: { monthly: 25, annual: 250 },
    description: 'For professionals who want it all.',
    features: [
      'Everything in Plus',
      'AI Coach with Memory',
      'Unlimited shared lists & workspaces',
      'Unlimited collaborators & team management',
      'Comments & collaboration',
      'Unlimited custom habit tracking',
      'Advanced tracking fields with custom lists',
      'External AI agent integrations',
      'Unlimited voice capture',
    ],
    accent: 'amber',
    trialDays: 7,
  },
]

export const PLAN_ORDER: Plan[] = ['free', 'plus', 'pro']
