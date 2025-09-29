/**
 * Convex Authentication Configuration
 * 
 * This file configures Clerk as the authentication provider for Convex.
 * Make sure you have the required environment variables set in .env.local
 */

// Get the Clerk issuer from environment variables
const clerkIssuer = 
  process.env.CLERK_JWT_ISSUER ||
  process.env.CLERK_ISSUER ||
  process.env.NEXT_PUBLIC_CLERK_JWT_ISSUER;

if (!clerkIssuer) {
  throw new Error(
    "Missing Clerk issuer. Set CLERK_JWT_ISSUER, CLERK_ISSUER, or NEXT_PUBLIC_CLERK_JWT_ISSUER in your environment variables."
  );
}

// Remove trailing slash if present
const normalizedIssuer = clerkIssuer.replace(/\/$/, '');

const authConfig = {
  providers: [
    {
      domain: normalizedIssuer,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
