import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Signed-in visitors of the public pages go straight to the app. This used to
// be `requireGuest()` inside those pages, which read the session on the
// server and so forced every marketing/auth page — for every visitor and
// crawler — to be rendered by a Vercel function. Here it's only a cookie
// presence check (no DB, no session decoding), so those pages are static.
//
// A cookie that's present but no longer valid is handled on the app side:
// requireAuth() sends the visitor to /api/auth/session-expired, which clears
// it — so this redirect can't loop.
export function middleware(request: NextRequest) {
  if (getSessionCookie(request)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/pricing', '/privacy', '/terms', '/cookies', '/sign-in', '/sign-up'],
}
