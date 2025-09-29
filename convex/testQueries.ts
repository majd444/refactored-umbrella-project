import { query } from './_generated/server';

/**
 * Test query to verify authentication status
 * Returns the current user's identity if authenticated
 */
export const getAuthStatus = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();

      if (!identity) {
        console.log('[getAuthStatus] No identity found - user is not authenticated');
        return { isAuthenticated: false } as const;
      }

      // Only log non-sensitive identity fields
      console.log('[getAuthStatus] User authenticated with identity summary:', {
        subject: identity.subject,
        name: identity.name,
        email: identity.email,
      });

      return {
        isAuthenticated: true,
        identity: {
          subject: identity.subject,
          name: identity.name,
          email: identity.email,
          tokenIdentifier: identity.tokenIdentifier,
        },
      } as const;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[getAuthStatus] Error while determining auth status:', message);
      // Never throw to the client; return a structured response instead
      return { isAuthenticated: false, error: message } as const;
    }
  },
});

/**
 * Public test query that doesn't require authentication
 * Used to verify basic Convex connectivity
 */
export const ping = query({
  args: {},
  handler: async () => {
    console.log('Ping received at:', new Date().toISOString());
    return { 
      status: 'pong',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  },
});
