import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

// This function will be called when a user signs in
export const createOrUpdateUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If there's a record by email (e.g., created from Stripe webhook) but without the correct userId,
    // merge it into the authenticated user's record by attaching the userId and updating fields.
    const emailRecord = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (emailRecord && emailRecord.userId !== args.userId) {
      return await ctx.db.patch(emailRecord._id, {
        userId: args.userId,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        lastLogin: Date.now(),
      })
    }

    // Check if user already exists by userId
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first()

    if (existingUser) {
      // Update existing user
      return await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        lastLogin: Date.now(),
      })
    } else {
      // Create new user with default plan 'free'
      return await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        plan: "free",
        createdAt: Date.now(),
        lastLogin: Date.now(),
      })
    }
  },
})

// Save Stripe customer ID on the authenticated user
export const setStripeCustomerId = mutation({
  args: { customerId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!user) {
      await ctx.db.insert("users", {
        userId: identity.subject,
        email: identity.email,
        plan: "free",
        stripeCustomerId: args.customerId,
        createdAt: Date.now(),
        lastLogin: Date.now(),
      });
      return { created: true as const };
    }
    await ctx.db.patch(user._id, { stripeCustomerId: args.customerId, lastLogin: Date.now() });
    return { updated: true as const };
  },
});

// Admin: set stripeCustomerId by userId or email using a shared secret
export const adminSetStripeCustomerId = mutation({
  args: {
    secret: v.string(),
    customerId: v.string(),
    userId: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const expected = process.env.WEBHOOK_SHARED_SECRET
    if (!expected) throw new Error("WEBHOOK_SHARED_SECRET is not configured in Convex env")
    if (args.secret !== expected) throw new Error("Unauthorized: bad secret")

    let user: any = null
    if (args.userId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .first()
    } else if (args.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first()
    }

    if (user) {
      await ctx.db.patch(user._id, { stripeCustomerId: args.customerId, lastLogin: Date.now() })
      return { updated: true as const }
    }

    await ctx.db.insert("users", {
      userId: args.userId ?? (args.email ?? "unknown"),
      email: args.email,
      plan: "free",
      stripeCustomerId: args.customerId,
      createdAt: Date.now(),
      lastLogin: Date.now(),
    })
    return { created: true as const }
  },
})

// Admin: get user's stripeCustomerId by userId
export const adminGetStripeCustomerId = query({
  args: { secret: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const expected = process.env.WEBHOOK_SHARED_SECRET
    if (!expected) throw new Error("WEBHOOK_SHARED_SECRET is not configured in Convex env")
    if (args.secret !== expected) throw new Error("Unauthorized: bad secret")

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first()
    return user?.stripeCustomerId ?? null
  },
})


// Admin endpoint used by the Stripe webhook to set a user's plan
// Requires a shared secret, and identifies the user by Clerk userId or email
export const adminSetPlan = mutation({
  args: {
    secret: v.string(),
    plan: v.union(v.literal("free"), v.literal("basic"), v.literal("pro")),
    userId: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const expected = process.env.WEBHOOK_SHARED_SECRET
    if (!expected) throw new Error("WEBHOOK_SHARED_SECRET is not configured in Convex env")
    if (args.secret !== expected) throw new Error("Unauthorized: bad secret")

    if (!args.userId && !args.email) {
      throw new Error("Must provide userId or email")
    }

    let user: { _id: any } | null = null
    if (args.userId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .first()
    } else if (args.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first()
    }

    if (user) {
      await ctx.db.patch(user._id, { plan: args.plan, lastLogin: Date.now() })
      return { updated: true as const }
    }

    // If no user found, create a new record with available identifier(s)
    await ctx.db.insert("users", {
      userId: args.userId ?? (args.email ?? "unknown"),
      email: args.email,
      name: undefined,
      imageUrl: undefined,
      plan: args.plan,
      createdAt: Date.now(),
      lastLogin: Date.now(),
    })
    return { created: true as const }
  },
})

 

// Return the authenticated user's record (or null if not found)
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    return user ?? null;
  },
})

// Update the current authenticated user's plan
export const setPlan = mutation({
  args: { plan: v.union(v.literal("free"), v.literal("basic"), v.literal("pro")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!user) {
      // If user doesn't exist yet, create one with this plan
      await ctx.db.insert("users", {
        userId,
        email: undefined,
        name: undefined,
        imageUrl: undefined,
        plan: args.plan,
        createdAt: Date.now(),
        lastLogin: Date.now(),
      });
      return { success: true as const };
    }
    await ctx.db.patch(user._id, { plan: args.plan, lastLogin: Date.now() });
    return { success: true as const };
  },
})

