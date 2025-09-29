import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return null;
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST() {
  try {
    const session = await auth();
    const userId = session.userId;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user || user.id !== userId) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const convex = getConvexClient();
    if (!convex) {
      return NextResponse.json({ ok: false, error: "NEXT_PUBLIC_CONVEX_URL not set" }, { status: 500 });
    }

    await convex.mutation(api.users.createOrUpdateUser, {
      userId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress ?? "",
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined,
      imageUrl: user.imageUrl,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("/api/sync-user failed", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
