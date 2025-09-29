'use server'

import { auth, clerkClient } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

// Lazily create Convex client at runtime to avoid build-time failures when env vars aren't present in CI
function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not set. Please add it to your environment (e.g., https://YOUR-DEPLOYMENT.convex.cloud).')
  }
  return new ConvexHttpClient(convexUrl)
}

export async function syncUser() {
  try {
    const session = await auth()
    const userId = session.userId
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }
    
    // Get user data from Clerk using server SDK (no env key required here)
    const user = await clerkClient.users.getUser(userId)
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    const convex = getConvexClient()
    await convex.mutation(api.users.createOrUpdateUser, {
      userId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress ?? undefined,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
      imageUrl: user.imageUrl,
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error syncing user with Convex:', error)
    return { success: false, error: 'Failed to sync user' }
  }
}

