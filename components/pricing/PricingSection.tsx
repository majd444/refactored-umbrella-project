"use client"

import { PricingCard } from "./PricingCard";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useClerk, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

type ClerkCheckoutOpen = (opts: { lineItems: { plan: string }[]; redirectUrl: string }) => void;
type GlobalClerk = { billing?: { checkout?: { open?: ClerkCheckoutOpen } } };

const pricingPlans = [
  {
    title: "Free Plan",
    price: "$0",
    description: "Perfect for trying out our chatbot service",
    features: [
      { text: "250 messages / month", included: true },
      { text: "1 chatbot", included: true },
      { text: "Email support", included: true },
      { text: "Website integration", included: false },
      { text: "Shopify integration", included: false },
      { text: "Remove branding", included: false },
      { text: "Lead export to Google Sheets", included: false },
      { text: "Team users", included: false },
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
  },
  {
    title: "Basic",
    price: "$10",
    period: "month",
    description: "Great for small businesses and growing teams",
    features: [
      { text: "10,000 messages / month", included: true },
      { text: "3 chatbots", included: true },
      { text: "Website + Shopify integration", included: true },
      { text: "Remove branding", included: true },
      { text: "Lead export to Google Sheets", included: true },
      { text: "Standard support", included: true },
      { text: "Team users", included: false },
      { text: "Advanced analytics", included: false },
    ],
    buttonText: "Start Basic Plan",
    buttonVariant: "premium" as const,
    popular: true,
  },
  {
    title: "Pro",
    price: "$20",
    period: "month",
    description: "Perfect for teams and advanced workflows",
    features: [
      { text: "25,000 messages / month", included: true },
      { text: "Up to 5 chatbots", included: true },
      { text: "Team users", included: true },
      { text: "Advanced team management", included: true },
      { text: "All integrations included", included: true },
      { text: "Priority support", included: true },
      { text: "Custom branding", included: true },
      { text: "Advanced analytics", included: true },
    ],
    buttonText: "Start Pro Plan",
    buttonVariant: "default" as const,
  },
];

export function PricingSection() {
  const router = useRouter();
  const { client } = useClerk();
  const { userId } = useAuth();
  

  // Diagnostics: log availability of Clerk billing checkout on /pricing load
  useEffect(() => {
    const globalClerk =
      typeof window !== "undefined"
        ? (window as unknown as { Clerk?: GlobalClerk }).Clerk
        : undefined;
    const clientOpen = (client as unknown as GlobalClerk | null)?.billing?.checkout?.open;
    const globalOpen = globalClerk?.billing?.checkout?.open;
    console.log("[Pricing Diagnostics] window.Clerk present:", !!globalClerk);
    console.log("[Pricing Diagnostics] client.billing.checkout.open present:", !!clientOpen);
    console.log("[Pricing Diagnostics] window.Clerk.billing.checkout.open present:", !!globalOpen);
  }, [client]);

  const handleFree = useCallback(() => {
    router.push("/dashboard");
  }, [userId]);

  const handleBasic = useCallback(() => {
    // If Stripe Payment Link is configured, prefer it and skip Clerk billing
    const stripeLink = process.env.NEXT_PUBLIC_STRIPE_LINK_BASIC;
    if (stripeLink) {
      // Append a simple return URL if not present
      const url = new URL(stripeLink);
      if (!url.searchParams.get("redirect_status")) {
        // Keep as-is; Payment Links handle redirect settings in Stripe Dashboard
      }
      // Pass Clerk userId so webhook can map session.client_reference_id
      if (userId) {
        url.searchParams.set("client_reference_id", userId);
      }
      window.location.href = url.toString();
      return;
    }

    // Stripe link not configured
    toast.error("Stripe payment link not set. Add NEXT_PUBLIC_STRIPE_LINK_BASIC to .env.local and restart.");
    return;
  }, [router, userId]);

  const handlePro = useCallback(() => {
    // Stripe-only for Pro; support both PRO and pro env var names
    const stripeLink = process.env.NEXT_PUBLIC_STRIPE_LINK_PRO || process.env.NEXT_PUBLIC_STRIPE_LINK_pro;
    if (stripeLink) {
      const url = new URL(stripeLink);
      if (userId) {
        url.searchParams.set("client_reference_id", userId);
      }
      window.location.href = url.toString();
      return;
    }

    toast.error("Stripe payment link not set. Add NEXT_PUBLIC_STRIPE_LINK_PRO (or _pro) to .env.local and restart.");
    return;
  }, [userId]);

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your business. Start free and scale as you grow.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={plan.features}
              buttonText={plan.buttonText}
              buttonVariant={plan.buttonVariant}
              popular={plan.popular}
              onClick={
                plan.title === "Free Plan"
                  ? handleFree
                  : plan.title === "Basic"
                  ? handleBasic
                  : handlePro
              }
            />
          ))}
        </div>
        
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            All plans include secure hosting, 99.9% uptime, and our commitment to your success.
          </p>
          <p className="text-sm text-muted-foreground">
            Need a custom solution? <a href="#" className="text-primary hover:underline">Contact our sales team</a>
          </p>
        </div>

        {/* Anchor for Clerk Pricing Table section */}
        <div id="clerk-pricing" className="mt-10" />
      </div>
    </section>
  );
}