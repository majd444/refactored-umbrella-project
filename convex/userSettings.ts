import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

// Return the current user's settings document, or null if not found/unauthenticated
export const getMySettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first()

    return settings ?? null
  },
})

// Upsert the current user's settings
export const upsertMySettings = mutation({
  args: {
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    language: v.optional(v.string()),
    timezone: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { ...args })
      return { updated: true as const }
    }

    await ctx.db.insert("userSettings", {
      userId: identity.subject,
      ...args,
    })
    return { created: true as const }
  },
})
