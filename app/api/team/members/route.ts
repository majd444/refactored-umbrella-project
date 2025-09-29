import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

type ClerkMembership = {
  id: string;
  role: "org:member" | "org:admin" | "org:owner" | string;
  public_user_data?: {
    user_id?: string;
    identifier?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  } | null;
  user_id?: string;
};

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { error: "Missing CLERK_SECRET_KEY server env var" },
        { status: 500 }
      );
    }

    // Ensure requester is a member of this organization
    const requesterResp = await fetch(
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

    const requesterJson = (await requesterResp.json()) as { data?: ClerkMembership[] };
    if (!requesterResp.ok || !requesterJson.data || requesterJson.data.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // List members
    const membersResp = await fetch(
      `https://api.clerk.com/v1/organizations/${organizationId}/memberships?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );
    if (!membersResp.ok) {
      const errJson = await membersResp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errJson?.errors?.[0]?.message || "Failed to fetch members" },
        { status: 500 }
      );
    }

    const membersJson = (await membersResp.json()) as { data?: ClerkMembership[] };
    const members = (membersJson.data || []).map((m: ClerkMembership) => ({
      id: m.id,
      userId: m.public_user_data?.user_id || m.user_id,
      role: m.role,
      emailAddress: m.public_user_data?.identifier,
      publicUserData: m.public_user_data,
    }));

    return NextResponse.json({ members });
  } catch (err: unknown) {
    console.error("/api/team/members error", err);
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
