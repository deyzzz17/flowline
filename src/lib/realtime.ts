// Vercel's serverless functions can't hold persistent WebSocket/SSE
// connections, so shared lists sync via a short client-side poll instead of
// a push channel. React Query already skips this while the tab is
// backgrounded (refetchIntervalInBackground defaults to false) and refires
// immediately on refocus, so this reads as near-instant in normal use.
export const SHARED_LIST_POLL_INTERVAL_MS = 3000
