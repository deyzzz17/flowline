import { NextResponse, type NextRequest } from 'next/server'

// Where requireAuth() sends a visitor whose session cookie is present but no
// longer valid (expired, revoked, deleted account): clears Better Auth's
// cookies and continues to sign-in. Without this, middleware.ts would see
// the stale cookie on /sign-in and bounce back to the app forever.
const COOKIE_NAMES = [
  'better-auth.session_token',
  'better-auth.session_data',
  'better-auth.dont_remember',
]

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/sign-in', request.url))
  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, '', { maxAge: 0, path: '/' })
    response.cookies.set(`__Secure-${name}`, '', { maxAge: 0, path: '/', secure: true })
  }
  return response
}
