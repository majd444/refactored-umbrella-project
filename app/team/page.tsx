"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type PublicUserData = {
  user_id?: string;
  identifier?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
} | null;

type Member = {
  id: string;
  userId?: string;
  role: string;
  emailAddress?: string | null;
  publicUserData?: PublicUserData;
};

export default function TeamPage() {
  const { organization, isLoaded: orgLoaded, membership } = useOrganization();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("org:member");
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const { toast } = useToast();

  const orgId = organization?.id;
  const isAdmin = useMemo(() => {
    const r = membership?.role;
    return r === "org:admin" || r === "org:owner";
  }, [membership]);

  useEffect(() => {
    async function loadMembers() {
      if (!orgId) return;
      setLoadingMembers(true);
      try {
        const res = await fetch(`/api/team/members?organizationId=${orgId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load members");
        setMembers((data.members as Member[]) || []);
      } catch (err: unknown) {
        console.error(err);
        toast({
          title: "Failed to load team members",
          description: err instanceof Error ? err.message : "Please try again",
          variant: "destructive",
        });
      } finally {
        setLoadingMembers(false);
      }
    }
    loadMembers();
  }, [orgId, toast]);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send invite");

      toast({ title: "Invitation sent", description: `${email} has been invited.` });
      setEmail("");
    } catch (err: unknown) {
      toast({ title: "Invite failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!orgLoaded) return null;

  if (!organization) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create or select an organization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You are not currently in an organization. Use the organization switcher to create
              or select one, then return to this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">Manage members of {organization?.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite a teammate</CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <form onSubmit={handleInvite} className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org:member">Member</SelectItem>
                    <SelectItem value="org:admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3 flex items-end">
                <Button type="submit" disabled={submitting || !email} className="w-full">
                  {submitting ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">You need admin access to invite members.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members found.</p>
          ) : (
            <ul className="divide-y">
              {members.map((m) => (
                <li key={m.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.publicUserData?.first_name || m.publicUserData?.identifier || m.emailAddress || m.userId}</div>
                    <div className="text-xs text-muted-foreground">{m.role}</div>
                  </div>
                  {/* Future: revoke/change role actions for admins */}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
