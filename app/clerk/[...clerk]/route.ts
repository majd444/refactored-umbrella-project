import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

const CLERK_FRONTEND_API = 'https://frontend-api.clerk.dev'

async function proxy(request: Request) {
  const url = new URL(request.url)
  const clerkPath = url.pathname.replace(/^\/clerk\/?/, '/')
  const targetUrl = `${CLERK_FRONTEND_API}${clerkPath}${url.search}`

  const hdrs = new Headers(request.headers)

  // Compute full proxy URL origin + /clerk
  const hdrList = await headers()
  const proto = hdrList.get('x-forwarded-proto') || url.protocol.replace(':', '')
  const host = hdrList.get('x-forwarded-host') || hdrList.get('host') || url.host
  const proxyBase = `${proto}://${host}/clerk`

  hdrs.set('Clerk-Proxy-Url', proxyBase)
  const secret = process.env.CLERK_SECRET_KEY
  if (secret) hdrs.set('Clerk-Secret-Key', secret)

  const xff = hdrList.get('x-forwarded-for') || ''
  if (xff) hdrs.set('X-Forwarded-For', xff)

  // Remove Next headers that shouldn't be forwarded
  hdrs.delete('host')

  const init: RequestInit = {
    method: request.method,
    headers: hdrs,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
    redirect: 'manual',
  }

  const resp = await fetch(targetUrl, init)

  // Clone response headers (filter hop-by-hop)
  const outHeaders = new Headers(resp.headers)
  outHeaders.delete('transfer-encoding')

  const res = new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: outHeaders,
  })
  // Ensure no caching on proxy responses
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const GET = proxy
export const HEAD = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
