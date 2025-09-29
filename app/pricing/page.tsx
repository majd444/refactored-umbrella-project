"use client";

import { PricingSection } from "@/components/pricing/PricingSection";
import { PricingTable, useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function PricingPage() {
  const { isSignedIn } = useUser();

  // Ensure a Convex user record exists as soon as a user signs in (pricing is the post-auth landing)
  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/sync-user", { method: "POST" }).catch(() => {});
    }
  }, [isSignedIn]);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <PricingSection />
        {/* Always keep the anchor so fallback scroll can find it */}
        <div id="clerk-pricing-table" className="max-w-4xl mx-auto mt-10">
          {isSignedIn ? (
            <PricingTable />
          ) : (
            <p className="text-center text-muted-foreground">
              Please sign in to view pricing and start checkout.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
