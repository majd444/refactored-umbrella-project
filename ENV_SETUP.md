# Environment Variables Setup

Based on your Clerk + Convex authentication configuration, you need the following environment variables in your `.env.local` file:

## Required Environment Variables

```bash
# Convex Configuration
CONVEX_DEPLOYMENT=effervescent-mandrill-295
NEXT_PUBLIC_CONVEX_URL=https://effervescent-mandrill-295.convex.cloud

# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Clerk JWT Configuration (Required for Convex Auth)
CLERK_JWT_ISSUER=https://your-subdomain.clerk.accounts.dev
# OR use one of these alternatives:
# CLERK_ISSUER=https://your-subdomain.clerk.accounts.dev
# NEXT_PUBLIC_CLERK_JWT_ISSUER=https://your-subdomain.clerk.accounts.dev

# Clerk Webhook Secret (Required for user sync)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Optional: Node Environment
NODE_ENV=development

# Default Discord Bot (Optional)
# If set, the app will seed a default Discord bot configuration server-side
# for an agent when none exists. The token is stored only in Convex and is
# never exposed to the client.
DISCORD_DEFAULT_CLIENT_ID=1234567890123456789
DISCORD_DEFAULT_BOT_TOKEN=your_bot_token_here

# (Optional) Public Client ID prefill in UI
# This is safe to expose to the client and is used to prefill the Client ID field
# and generate the invite link before saving.
NEXT_PUBLIC_DISCORD_DEFAULT_CLIENT_ID=1234567890123456789
```

## How to Get These Values

### 1. Clerk Dashboard Values
Go to your [Clerk Dashboard](https://dashboard.clerk.com):
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**: Found in "API Keys" section
- **CLERK_SECRET_KEY**: Found in "API Keys" section  
- **CLERK_JWT_ISSUER**: Found in "JWT Templates" → "convex" template → "Issuer" field
- **CLERK_WEBHOOK_SECRET**: Found in "Webhooks" section after creating a webhook

### 2. Convex Values
- **CONVEX_DEPLOYMENT**: Already set to `effervescent-mandrill-295` (from convex.json)
- **NEXT_PUBLIC_CONVEX_URL**: Should be `https://effervescent-mandrill-295.convex.cloud`

## Important Notes

1. **JWT Issuer**: This must match exactly what's in your Clerk JWT template
2. **Webhook**: You need to create a webhook in Clerk pointing to `/api/webhooks/clerk`
3. **JWT Template**: You need a "convex" JWT template in Clerk with audience set to "convex"
4. **Discord Defaults**: If you use `DISCORD_DEFAULT_*` variables, the UI will attempt to seed
   a default bot configuration on first load of the Discord config panel when no token is present.
   Users can then click "Invite Bot" to add it to their server.

## Troubleshooting

If you're still getting authentication errors:
1. Check that all environment variables are set correctly
2. Restart your development server after changing .env.local
3. Verify your Clerk JWT template has the correct issuer and audience
4. Make sure you're logged in to your Clerk account in the browser
