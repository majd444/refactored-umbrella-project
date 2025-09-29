import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

// Helper to get Convex client
function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  return new ConvexHttpClient(url);
}

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const convexSecret = process.env.WEBHOOK_SHARED_SECRET;

  if (!stripeSecret || !webhookSecret || !convexSecret) {
    console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET or WEBHOOK_SHARED_SECRET env vars");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret);

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // We expect checkout.session.completed for Payment Links
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    let plan = (session.metadata?.plan as "free" | "basic" | "pro" | undefined) || undefined;
    const email = session.customer_details?.email || (session.customer_email as string | undefined);
    const clerkUserId = session.client_reference_id || undefined;
    const customerId = (typeof session.customer === "string" ? session.customer : session.customer?.id) || undefined;

    // Fallback: infer plan from line items / amount if metadata is missing (common with Payment Links)
    if (!plan) {
      try {
        const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const li = items.data[0];
        const unitAmount = li?.price?.unit_amount ?? null; // in cents
        const nickname = li?.price?.nickname?.toLowerCase();

        if (nickname?.includes("basic")) plan = "basic";
        else if (nickname?.includes("pro")) plan = "pro";
        else if (unitAmount != null) {
          if (unitAmount <= 1000) plan = "basic"; // $10
          else if (unitAmount >= 2000) plan = "pro"; // $20
        } else if (session.amount_total != null) {
          if (session.amount_total <= 1000) plan = "basic";
          else if (session.amount_total >= 2000) plan = "pro";
        }
      } catch (e) {
        console.warn("Failed to infer plan from line items", e);
      }
    }
    if (!plan) {
      console.warn("No plan could be determined on checkout.session.completed; ignoring");
      return NextResponse.json({ received: true });
    }
    try {
      const convex = getConvex();
      // Persist Stripe customer ID for robustness
      if (customerId) {
        if (clerkUserId) {
          await convex.mutation(api.users.adminSetStripeCustomerId, {
            secret: convexSecret,
            customerId,
            userId: clerkUserId,
          });
        } else if (email) {
          await convex.mutation(api.users.adminSetStripeCustomerId, {
            secret: convexSecret,
            customerId,
            email,
          });
        }
      }
      if (clerkUserId) {
        console.log("[Webhook] Setting plan via userId", { plan, clerkUserId });
        await convex.mutation(api.users.adminSetPlan, {
          secret: convexSecret,
          plan,
          userId: clerkUserId,
        });
      } else if (email) {
        console.log("[Webhook] Setting plan via email", { plan, email });
        await convex.mutation(api.users.adminSetPlan, {
          secret: convexSecret,
          plan,
          email,
        });
      } else {
        console.warn("No user identifier (client_reference_id or email) on session; cannot map user");
      }
      return NextResponse.json({ received: true });
    } catch (err) {
      console.error("Failed to set plan via Convex", err);
      return NextResponse.json({ error: "Failed to set plan" }, { status: 500 });
    }
  }

  // Ignore other events
  return NextResponse.json({ received: true });
}

