"use client";

import { SignedIn, SignedOut, RedirectToSignIn, PaymentMethods } from "@clerk/nextjs";

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Billing</h1>
        <SignedOut>
          <RedirectToSignIn redirectUrl="/billing" />
        </SignedOut>
        <SignedIn>
          <div className="max-w-3xl mx-auto">
            {/* Clerk's Payment Methods card */}
            <PaymentMethods />
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
