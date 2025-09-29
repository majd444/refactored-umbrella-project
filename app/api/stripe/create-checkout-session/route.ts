import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { currentUser } from "@clerk/nextjs/server"

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
  }
  const stripe = new Stripe(stripeSecret)

  const body = await req.json().catch(() => ({})) as { priceId?: string, quantity?: number, plan?: "free" | "basic" | "pro" }
  const priceId = body.priceId
  if (!priceId) {
    return NextResponse.json({ error: "priceId is required" }, { status: 400 })
  }

  const user = await currentUser()
  if (!user?.emailAddresses?.[0]?.emailAddress) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const successPath = body.plan === "pro" ? "/payment_sub_20" : "/payment_sub_10"
  const successUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}${successPath}`
    : `${req.nextUrl.origin}${successPath}`
  const cancelUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=cancelled`
    : `${req.nextUrl.origin}/settings?checkout=cancelled`

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: body.quantity ?? 1 }],
    customer_email: user.emailAddresses[0].emailAddress,
    client_reference_id: user.id,
    metadata: body.plan ? { plan: body.plan } : undefined,
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return NextResponse.json({ url: session.url }, { status: 200 })
}

