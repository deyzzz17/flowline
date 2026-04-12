import { requireAuth } from "@/lib/require-auth"

export const ProtectedRoute = async ({ children }: { children: React.ReactNode }) => {
  await requireAuth()

  return children
}
