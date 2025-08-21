import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new chat session
export const createSession = mutation({
  args: {
    agentId: v.id("agents"),
    userId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("chatSessions", {
      agentId: args.agentId,
      userId: args.userId,
      metadata: args.metadata || {},
      lastActive: Date.now(),
      createdAt: Date.now(),
    });
    return sessionId;
  },
});

// Get a session by ID
export const getSession = query({
  args: { id: v.id("chatSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update session last active timestamp
export const updateSessionLastActive = mutation({
  args: { id: v.id("chatSessions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastActive: Date.now() });
  },
});

// Create a new message
export const createMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      metadata: args.metadata || {},
      createdAt: Date.now(),
    });
    return messageId;
  },
});

// Get messages for a session
export const getSessionMessages = query({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});
