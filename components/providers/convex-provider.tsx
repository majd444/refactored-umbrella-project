"use client"

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexProvider } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';
const hasClerkEnv = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Extend Clerk's AuthObject type
declare module '@clerk/nextjs' {
  interface AuthObject {
    getToken: (options?: { template?: string }) => Promise<string | null>;
  }
}

// Create the Convex client with proper error handling
function createConvexClient() {
  // Always return a client instance, but don't initialize WebSocket during SSR
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error('Missing NEXT_PUBLIC_CONVEX_URL environment variable');
    return null;
  }
  
  try {
    if (typeof window !== 'undefined') {
      console.log('Initializing Convex client with URL:', convexUrl);
    }
    
    const options: {
      unsavedChangesWarning: boolean;
      verbose: boolean;
      webSocketConstructor?: typeof WebSocket;
    } = {
      unsavedChangesWarning: typeof window !== 'undefined',
      verbose: process.env.NODE_ENV === 'development',
    };
    
    // Only add webSocketConstructor if window is defined
    if (typeof window !== 'undefined') {
      options.webSocketConstructor = WebSocket;
    }
    
    return new ConvexReactClient(convexUrl, options);
  } catch (error) {
    console.error('Failed to initialize Convex client:', error);
    return null;
  }
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  
  // Initialize the Convex client with useMemo to prevent recreation
  const convexClient = useMemo(() => {
    const client = createConvexClient();
    if (!client) return null;
    return client;
  }, []);

  const [, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('unauthenticated');
  const { isLoaded: clerkLoaded, getToken } = useAuth();
  const expectedIssuer = process.env.NEXT_PUBLIC_CLERK_JWT_ISSUER?.replace(/\/$/, '');
  const expectedAudience = 'convex';

  // Configure auth on the client (when Clerk is present) and test the connection
  useEffect(() => {
    if (!convexClient) return;

    let cancelled = false;

    const setupAndTest = async () => {
      try {
        // If Clerk is configured, wait for it to load and attach token fetcher
        if (hasClerkEnv) {
          if (!clerkLoaded) {
            // Wait for Clerk to load; don't block rendering
            return;
          }
          // Attach token getter so subsequent queries include auth
          convexClient.setAuth(async () => {
            try {
              const token = await getToken({ template: 'convex' });
              if (!token) {
                console.warn('[Convex] Clerk returned no token for template "convex". Proceeding unauthenticated.');
                return null;
              }
              // Soft-validate token issuer/audience client-side to avoid sending a bad token
              try {
                const parts = token.split('.');
                if (parts.length === 3) {
                  const payloadJson = JSON.parse(atob(parts[1]));
                  const iss: string | undefined = payloadJson.iss?.replace?.(/\/$/, '') || payloadJson.iss;
                  const aud = payloadJson.aud;
                  if (expectedIssuer && iss && iss !== expectedIssuer) {
                    console.warn('[Convex] Token issuer mismatch. Expected:', expectedIssuer, 'Got:', iss, 'Proceeding unauthenticated.');
                    return null;
                  }
                  if (aud && aud !== expectedAudience) {
                    console.warn('[Convex] Token audience mismatch. Expected:', expectedAudience, 'Got:', aud, 'Proceeding unauthenticated.');
                    return null;
                  }
                }
              } catch (e) {
                console.warn('[Convex] Failed to parse Clerk token for sanity check; sending token as-is.');
              }
              return token;
            } catch (e) {
              console.error('[Convex] Failed to fetch Clerk token, proceeding unauthenticated:', e);
              return null;
            }
          });
        }

        console.log('🔍 [Convex] Testing connection...');
        const testResult = await convexClient.query(api.testQueries.getAuthStatus).catch((e) => {
          console.debug('[Convex] Auth test query failed silently (non-blocking):', e);
          return null;
        });
        if (!cancelled && testResult) {
          console.log('🔍 [Convex] Auth test result:', testResult);
          setAuthStatus(testResult.isAuthenticated ? 'authenticated' : 'unauthenticated');
        }
      } catch (error) {
        if (!cancelled) {
          console.debug('❌ [Convex] Connection test failed (non-blocking):', error);
          // On repeated auth failures, clear auth to avoid a bad JWT causing disconnect loops
          try {
            convexClient.clearAuth?.();
          } catch {}
          // Don't force a loading state; keep current status to avoid jank
        }
      }
    };

    setupAndTest();

    const interval = setInterval(setupAndTest, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [convexClient, hasClerkEnv, clerkLoaded, getToken]);
  
  // Show error if client initialization fails
  if (!convexClient) {
    // Use a client-side only component to show the error
    const ErrorDisplay = () => {
      const [mounted, setMounted] = useState(false);
      
      useEffect(() => {
        setMounted(true);
      }, []);
      
      if (!mounted) {
        return <div className="min-h-screen bg-background" />; // Empty div during SSR
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <div className="text-center space-y-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-lg font-semibold text-destructive">
                Convex Initialization Error
              </h2>
              <p className="text-sm text-destructive/90 mt-2">
                Failed to initialize the Convex client. Please check the following:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-left">
                <li>Verify NEXT_PUBLIC_CONVEX_URL is set in your .env.local file</li>
                <li>Ensure the Convex deployment is running</li>
                <li>Check your network connection</li>
                <li>Verify Clerk authentication is properly configured</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    };
    
    return <ErrorDisplay />;
  }
  
  // Do not block rendering based on authStatus; render app immediately.

  // When Clerk is not configured, fallback to plain ConvexProvider
  if (!hasClerkEnv) {
    return (
      <ConvexProvider client={convexClient}>
        {children}
      </ConvexProvider>
    );
  }

  return (
    <ConvexProviderWithClerk 
      client={convexClient}
      useAuth={useAuth}
    >
      {children}
    </ConvexProviderWithClerk>
  );
}

export default ConvexClientProvider;
