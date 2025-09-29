"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

export default function PaymentSub10() {
  const router = useRouter();
  const setPlan = useMutation(api.users.setPlan);
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // Optimistically set plan to basic only if the user is authenticated.
    // The Stripe webhook remains source-of-truth and will reconcile if needed.
    if (isLoaded && isSignedIn) {
      setPlan({ plan: "basic" }).catch(() => {/* non-blocking */});
    }
    // Redirect the user back to dashboard quickly, with a hard fallback.
    const t1 = setTimeout(() => {
      try {
        router.replace("/dashboard");
      } catch {}
    }, 100);
    const t2 = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.replace("/dashboard");
      }
    }, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router, setPlan, isLoaded, isSignedIn]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>
          Thanks! Finalizing your purchase… {" "}
          <a href="/dashboard" className="underline">Go to dashboard</a>
        </span>
      </div>
    </main>
  );
}

