import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { organizationId, email, role } = body || {};

    if (!organizationId || !email) {
      return NextResponse.json(
        { error: "organizationId and email are required" },
        { status: 400 }
      );
    }

    const targetRole: "org:member" | "org:admin" = role === "org:admin" ? "org:admin" : "org:member";

    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Missing CLERK_SECRET_KEY server env var" }, { status: 500 });
    }

    // Ensure inviter is an admin/owner of the organization
    const membershipResp = await fetch(
      `https://api.clerk.com/v1/organizations/${organizationId}/memberships?user_id=${encodeURIComponent(
        userId
      )}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );
    const membershipJson = await membershipResp.json().catch(() => ({} as any));
    const inviterRole: string | undefined = membershipJson?.data?.[0]?.role;
    const isAdmin = inviterRole === "org:admin" || inviterRole === "org:owner";

    if (!isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const inviteResp = await fetch(
      `https://api.clerk.com/v1/organizations/${organizationId}/invitations`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          role: targetRole,
          inviter_user_id: userId,
          redirect_url: `${appUrl}/team`,
        }),
      }
    );
    const invitation = await inviteResp.json().catch(() => ({}));
    if (!inviteResp.ok) {
      return NextResponse.json(
        { error: invitation?.errors?.[0]?.message || "Failed to send invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, invitation });
  } catch (err: unknown) {
    console.error("/api/team/invite error", err);
    return NextResponse.json(
      {
        error:
          (typeof err === "object" && err && "errors" in err && (err as any).errors?.[0]?.message) ||
          (err instanceof Error ? err.message : "Internal server error"),
      },
      { status: 500 }
    );
  }
}
