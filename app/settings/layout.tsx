"use client"

import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SettingsLayout({
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
        fetch('/api/sync-user', { method: 'POST' }).catch(() => {})
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
