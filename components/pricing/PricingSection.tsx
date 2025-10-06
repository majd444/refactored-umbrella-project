"use client"

import { PricingCard } from "./PricingCard";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

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
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
  },
  {
    title: "Pro",
    price: "$10",
    period: "month",
    description: "Great for small businesses and growing teams",
    features: [
      { text: "25,000 messages / month", included: true },
      { text: "Up to 5 chatbots", included: true },
      { text: "Website + Shopify integration", included: true },
      { text: "Remove branding", included: true },
      { text: "Standard support", included: true },
    ],
    buttonText: "Start Pro Plan",
    buttonVariant: "premium" as const,
    popular: true,
  },
  {
    title: "Unlimited",
    price: "$20",
    period: "month",
    description: "Perfect for teams and advanced workflows",
    features: [
      { text: "Unlimited* messages", included: true },
      { text: "Unlimited chatbots", included: true },
      { text: "Advanced team management", included: true },
      { text: "All integrations included", included: true },
      { text: "Priority support", included: true },
      { text: "Custom branding", included: true },
      { text: "Advanced analytics", included: true },
    ],
    buttonText: "Start Unlimited Plan",
    buttonVariant: "default" as const,
  },
];

export function PricingSection() {
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;

  const handleFree = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handlePro = useCallback(() => {
    // Optional: Stripe Payment Link for Pro
    const stripeLink = process.env.NEXT_PUBLIC_STRIPE_LINK_PRO;
    if (stripeLink) {
      const url = new URL(stripeLink);
      if (userId) {
        url.searchParams.set("client_reference_id", userId);
      }
      window.location.href = url.toString();
      return;
    }
    toast.error("Stripe payment link not set. Add NEXT_PUBLIC_STRIPE_LINK_PRO to your env.");
  }, [userId]);

  const handleUnlimited = useCallback(() => {
    const stripeLink = process.env.NEXT_PUBLIC_STRIPE_LINK_UNLIMITED as string | undefined;
    if (stripeLink) {
      const url = new URL(stripeLink);
      if (userId) {
        url.searchParams.set("client_reference_id", userId);
      }
      window.location.href = url.toString();
      return;
    }
    toast.error("Stripe payment link not set. Add NEXT_PUBLIC_STRIPE_LINK_UNLIMITED to your env.");
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
                  : plan.title === "Pro"
                  ? handlePro
                  : handleUnlimited
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
      </div>
    </section>
  );
}