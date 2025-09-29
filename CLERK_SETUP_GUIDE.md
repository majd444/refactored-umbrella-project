# Clerk JWT Template Setup Guide

## The Problem
Your authentication is failing because:
1. ❌ **Missing JWT Template**: Clerk doesn't have a "convex" JWT template
2. ❌ **User Not Signed In**: You might not be logged into your app
3. ❌ **Missing Environment Variable**: `NEXT_PUBLIC_CLERK_JWT_ISSUER` is needed

## Step-by-Step Fix

### 1. Create Clerk JWT Template
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your "ideal-dog-62" application
3. Navigate to **JWT Templates** in the sidebar
4. Click **+ New template**
5. Configure the template:
   ```
   Name: convex
   Audience: convex
   Issuer: https://ideal-dog-62.clerk.accounts.dev (auto-filled)
   Subject: {{user.id}}
   ```
6. **Save** the template

### 2. Update Your .env.local File
Copy the content from `FIXED_ENV_LOCAL.txt` to your `.env.local` file, which now includes:
```bash
NEXT_PUBLIC_CLERK_JWT_ISSUER=https://ideal-dog-62.clerk.accounts.dev
```

### 3. Restart Your Development Server
```bash
npm run dev
```

### 4. Sign In to Your App
1. Go to `http://localhost:3000`
2. Click **Sign In** or navigate to `/sign-in`
3. Sign in with your Clerk account
4. You should be redirected to `/dashboard`

### 5. Test Authentication
After signing in, try creating an agent again. The console should show:
```
🔍 [Convex] Auth test result: {isAuthenticated: true}
```

## Troubleshooting

### If you still get authentication errors:

1. **Check JWT Template**: Verify the template name is exactly "convex"
2. **Check Audience**: Must be exactly "convex" (lowercase)
3. **Clear Browser Cache**: Hard refresh (Cmd+Shift+R)
4. **Check Console**: Look for Clerk token warnings in browser console

### Common Issues:
- **Template name mismatch**: Must be exactly "convex"
- **Audience mismatch**: Must be exactly "convex" 
- **Not signed in**: User must be logged into Clerk
- **Cached tokens**: Clear browser cache/cookies

## Verification
Once working, you should see:
1. ✅ User signed in to Clerk
2. ✅ `🔍 [Convex] Auth test result: {isAuthenticated: true}`
3. ✅ Agent creation works without errors
