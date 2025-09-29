import { query, mutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
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

// Count total operations (messages) across all agents owned by the current user
export const countOperationsByOwner = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    // Fetch all agents for this owner
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect() as Doc<'agents'>[];
    if (agents.length === 0) return 0;

    let total = 0;
    for (const agent of agents) {
      const sessions = await ctx.db
        .query("chatSessions")
        .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
        .collect() as Doc<'chatSessions'>[];
      for (const s of sessions) {
        const messages = await ctx.db
          .query("chatMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", s._id))
          .collect() as Doc<'chatMessages'>[];
        // Count only messages sent by the chatbot
        total += messages.filter((m) => m.role === 'assistant').length;
      }
    }

    return total;
  },
});

// List all sessions for a given agent (only for the agent owner)
export const listByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        console.warn('[sessions.listByAgent] Unauthenticated access');
        return [];
      }
      const agent = await ctx.db.get(args.agentId);
      if (!agent) {
        console.warn('[sessions.listByAgent] Agent not found', { agentId: args.agentId });
        return [];
      }
      const ownerId = (agent as { userId?: string }).userId;
      if (!ownerId || ownerId !== identity.subject) {
        console.warn('[sessions.listByAgent] Not authorized', { user: identity.subject, ownerId });
        return [];
      }

      const sessions = await ctx.db
        .query("chatSessions")
        .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
        .order("desc")
        .collect();

      return sessions;
    } catch (e) {
      console.error('[sessions.listByAgent] error', e);
      return [];
    }
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

// Get the most recent session for a given agent and user
export const getLatestByAgentAndUser = query({
  args: {
    agentId: v.id("agents"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Query by userId (indexed), then filter by agentId
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return sessions.find((s) => s.agentId === args.agentId) || null;
  },
});

// Update session metadata with collected user info
export const updateSessionUserInfo = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    userInfo: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    const prevMeta = (session as { metadata?: Record<string, unknown> }).metadata || {};
    const merged = { ...prevMeta, userInfo: { ...(prevMeta as { userInfo?: Record<string, string> }).userInfo, ...args.userInfo } };
    await ctx.db.patch(args.sessionId, { metadata: merged });
  },
});

// List recent activity across all agents owned by the current user.
// Returns a lightweight list of recent sessions with a small slice of their messages.
// This is designed for a dashboard overview.
export const listRecentActivitiesByOwner = query({
  args: {
    limitSessions: v.optional(v.number()),
    limitMessagesPerSession: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [] as Array<{
        agentId: string;
        agentName: string;
        sessionId: string;
        lastActive: number;
        createdAt: number;
        messages: Array<{ _id: string; role: string; content: string; createdAt: number }>;
      }>;
    }

    const limitSessions = Math.max(1, Math.min(50, (args.limitSessions ?? 20)));
    const limitMessagesPerSession = Math.max(1, Math.min(10, (args.limitMessagesPerSession ?? 3)));

    // Get all agents owned by the user
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect() as Doc<'agents'>[];
    if (agents.length === 0) return [];

    const agentMap = new Map<string, { _id: Id<'agents'>; name?: string }>();
    for (const a of agents) {
      agentMap.set(a._id, { _id: a._id, name: a.name });
    }

    // For each agent, get recent sessions, then merge and sort globally by lastActive
    const allSessions: Array<Doc<'chatSessions'>> = [];
    for (const a of agents) {
      const sessions = await ctx.db
        .query("chatSessions")
        .withIndex("by_agent", (q) => q.eq("agentId", a._id))
        .order("desc")
        .collect() as Doc<'chatSessions'>[];
      allSessions.push(...sessions);
    }

    // Sort by lastActive desc and take top N
    const recent = allSessions
      .sort((s1, s2) => (Number(s2.lastActive) || 0) - (Number(s1.lastActive) || 0))
      .slice(0, limitSessions);

    // For each recent session, fetch a small slice of messages (most recent first)
    const items: Array<{
      agentId: string;
      agentName: string;
      sessionId: string;
      lastActive: number;
      createdAt: number;
      messages: Array<{ _id: string; role: string; content: string; createdAt: number }>;
    }> = [];

    for (const s of recent) {
      const msgsDesc = await ctx.db
        .query("chatMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", s._id))
        .order("desc")
        .collect() as Doc<'chatMessages'>[];
      const msgs = msgsDesc
        .slice(0, limitMessagesPerSession)
        .map((m) => ({
          _id: String(m._id),
          role: String(m.role),
          content: String(m.content),
          createdAt: Number(m.createdAt) || 0,
        }))
        // Present oldest-to-newest in the UI chunk
        .reverse();

      const agentId = String(s.agentId);
      const agent = agentMap.get(s.agentId as Id<'agents'>);
      items.push({
        agentId,
        agentName: agent?.name || "Untitled Agent",
        sessionId: String(s._id),
        lastActive: Number(s.lastActive) || 0,
        createdAt: Number(s.createdAt) || 0,
        messages: msgs,
      });
    }

    return items;
  },
});
