import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { currentUser } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

export async function GET(_req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
  }
  const stripe = new Stripe(stripeSecret)
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const webhookSecret = process.env.WEBHOOK_SHARED_SECRET
  if (!convexUrl || !webhookSecret) {
    return NextResponse.json({ error: "Missing Convex env (NEXT_PUBLIC_CONVEX_URL/WEBHOOK_SHARED_SECRET)" }, { status: 500 })
  }
  const convex = new ConvexHttpClient(convexUrl)

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Prefer stored Stripe customer ID in Convex for robustness
  const userId = user.id
  let customerId: string | null = null
  try {
    customerId = await convex.query(api.users.adminGetStripeCustomerId, { secret: webhookSecret, userId })
  } catch {}

  // If not stored, try to resolve by email
  let customer = null as Stripe.Customer | null
  if (customerId) {
    try {
      const cust = await stripe.customers.retrieve(customerId)
      if (!('deleted' in cust) || cust.deleted !== true) customer = cust as Stripe.Customer
    } catch {}
  }
  if (!customer) {
    const customers = await stripe.customers.list({ email, limit: 1 })
    customer = customers.data[0] || null
  }
  if (!customer) {
    return NextResponse.json({ invoices: [] }, { status: 200 })
  }

  const invs = await stripe.invoices.list({ customer: customer.id, limit: 20 })
  const invoices = invs.data.map((inv) => ({
    id: inv.id,
    date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
    description: inv.lines?.data?.[0]?.description || inv.description || "Subscription",
    amount: typeof inv.amount_paid === "number" && inv.amount_paid > 0 ? inv.amount_paid : inv.total || 0,
    currency: inv.currency?.toUpperCase() || "USD",
    status: inv.status || "open",
    hosted_invoice_url: inv.hosted_invoice_url || null,
    invoice_pdf: inv.invoice_pdf || null,
  }))

  return NextResponse.json({ invoices }, { status: 200 })
}
