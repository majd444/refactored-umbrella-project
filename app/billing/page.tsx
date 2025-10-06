"use client";

import { useState } from "react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);

  async function openBillingPortal() {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      if (!res.ok) {
        console.error("Failed to create portal session", await res.json().catch(() => ({})));
        return;
      }
      const data: { url?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Billing</h1>
        <SignedOut>
          <RedirectToSignIn redirectUrl="/billing" />
        </SignedOut>
        <SignedIn>
          <div className="max-w-3xl mx-auto">
            {/* Manage payment methods and subscriptions in Stripe Billing Portal */}
            <div className="rounded-lg border p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Manage billing</h2>
                <p className="text-muted-foreground mt-1">
                  Update payment methods, view invoices, and manage your subscription securely in Stripe.
                </p>
              </div>
              <Button onClick={openBillingPortal} disabled={loading}>
                {loading ? "Opening…" : "Open Billing Portal"}
              </Button>
            </div>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
