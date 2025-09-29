import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { currentUser } from "@clerk/nextjs/server"

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
  }
  const stripe = new Stripe(stripeSecret)

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Find or create customer by email
  let customerId: string | null = null
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) {
    customerId = existing.data[0].id
  } else {
    const created = await stripe.customers.create({ email, name: user?.fullName || undefined })
    customerId = created.id
  }

  const returnUrl = process.env.STRIPE_PORTAL_RETURN_URL || `${req.nextUrl.origin}/settings`

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId!,
    return_url: returnUrl,
  })

  return NextResponse.json({ url: session.url, customerId }, { status: 200 })
}
