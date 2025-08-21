'use server'

import { auth } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function syncUser() {
  try {
    const session = await auth()
    const userId = session.userId
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }
    
    // Get user data from Clerk
    const user = await fetch(
      `https://api.clerk.com/v1/users/${userId}`, 
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    ).then(res => res.json())
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    await convex.mutation(api.users.createOrUpdateUser, {
      userId: user.id,
      email: user.email_addresses[0]?.email_address,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || undefined,
      imageUrl: user.image_url,
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error syncing user with Convex:', error)
    return { success: false, error: 'Failed to sync user' }
  }
}
