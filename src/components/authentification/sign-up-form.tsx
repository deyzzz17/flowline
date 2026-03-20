import { useSignUp } from '@/hooks/authentification/use-sign-up'
import { AlertCircleIcon } from 'lucide-react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

export const SignUpForm = () => {
  const { name, setName, email, setEmail, password, setPassword, error, isLoading, handleSubmit } =
    useSignUp()

  return (
    <>
      <div className="space-y-1.5 text-center md:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">Start your journey with Flowline today.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="h-10 rounded-xl border-border/60 bg-background placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 rounded-xl border-border/60 bg-background placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className={cn(
              'h-10 rounded-xl border-border/60 bg-background placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30',
              error && 'border-destructive/50 focus-visible:ring-destructive/30',
            )}
          />
          <p className="text-xs text-muted-foreground/60">Must be at least 8 characters.</p>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="group relative h-10 w-full overflow-hidden rounded-xl bg-violet-600 font-semibold text-white shadow-sm shadow-violet-500/20 transition-all hover:bg-violet-500 hover:shadow-violet-500/30 disabled:opacity-60"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Creating account...
            </span>
          ) : (
            'Create account'
          )}
          <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground/60">
        By creating an account, you agree to our{' '}
        <a href="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </a>
        .
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <a
          href="/sign-in"
          className="font-semibold text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400"
        >
          Sign in
        </a>
      </p>
    </>
  )
}
