import { NextRequest, NextResponse } from "next/server";
import { Webhook, WebhookRequiredHeaders } from "svix";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  return new ConvexHttpClient(url);
}

function getClerkSecret() {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) throw new Error("CLERK_WEBHOOK_SECRET is not set");
  return secret;
}

function extractEmail(evt: any): string | undefined {
  try {
    const data = evt.data?.object ?? evt.data;
    const primaryId = data?.primary_email_address_id as string | undefined;
    const emails: any[] = data?.email_addresses ?? [];
    let email = emails.find((e) => e.id === primaryId)?.email_address as string | undefined;
    if (!email) {
      email = emails[0]?.email_address as string | undefined;
    }
    return email;
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = getClerkSecret();
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers) as Record<string, string> & WebhookRequiredHeaders;
    const wh = new Webhook(secret);

    let evt: any;
    try {
      evt = wh.verify(payload, headers);
    } catch (e) {
      console.error("Clerk webhook signature verification failed", e);
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    const type = evt.type as string;
    if (type === "user.created" || type === "user.updated") {
      const userId = evt.data?.id as string | undefined;
      const email = extractEmail(evt);
      const firstName = evt.data?.first_name as string | undefined;
      const lastName = evt.data?.last_name as string | undefined;
      const imageUrl = evt.data?.image_url as string | undefined;
      if (!userId) {
        return NextResponse.json({ ok: false, error: "Missing user id" }, { status: 400 });
      }
      const name = [firstName || "", lastName || ""].join(" ").trim() || undefined;
      try {
        const convex = getConvex();
        await convex.mutation(api.users.createOrUpdateUser, {
          userId,
          email: email ?? "",
          name,
          imageUrl,
        });
      } catch (e) {
        console.error("Failed to upsert user in Convex from Clerk webhook", e);
        return NextResponse.json({ ok: false, error: "Convex upsert failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/webhooks/clerk error", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
