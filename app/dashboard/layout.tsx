"use client"

import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        router.push('/sign-in/[[...sign-in]]')
      } else {
        // Sync user with Convex via API route
        fetch('/api/sync-user', { method: 'POST' })
          .then(async (res) => {
            const data = await res.json().catch(() => null)
            if (!res.ok) {
              console.error('[sync-user] failed', res.status, data)
            } else {
              console.log('[sync-user] ok', data)
            }
          })
          .catch((e) => console.error('[sync-user] network error', e))
      }
    }
  }, [isLoaded, userId, router])

  if (!isLoaded) {
    return null // or a loading spinner
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
