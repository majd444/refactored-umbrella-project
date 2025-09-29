"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ConvexHealthPage() {
  const ping = useQuery(api.testQueries.ping);
  const auth = useQuery(api.testQueries.getAuthStatus);

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Convex Health</h1>

      <section className="mb-6 border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Connectivity (Public)</h2>
        {ping ? (
          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">{JSON.stringify(ping, null, 2)}</pre>
        ) : (
          <div className="text-sm text-gray-600">Loading ping...</div>
        )}
      </section>

      <section className="mb-6 border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Auth Status (Protected)</h2>
        {auth ? (
          auth.isAuthenticated ? (
            <div className="bg-green-50 border border-green-200 p-3 rounded">
              <div className="text-green-700 font-medium">Authenticated</div>
              <pre className="mt-2 bg-white p-3 rounded text-sm overflow-auto">{JSON.stringify(auth.identity, null, 2)}</pre>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <div className="text-yellow-700 font-medium">Not authenticated</div>
              <div className="text-sm text-yellow-700 mt-1">
                Your Clerk JWT isnt being accepted by Convex yet.
              </div>
            </div>
          )
        ) : (
          <div className="text-sm text-gray-600">Loading auth status...</div>
        )}
      </section>

      <section className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Next steps</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Ensure your Clerk JWT template named <code>convex</code> has audience <code>convex</code>.</li>
          <li>Set the template issuer to your Clerk instance with a trailing slash, e.g. <code>https://meet-quetzal-92.clerk.accounts.dev/</code>.</li>
          <li>In Convex prod (effervescent-mandrill-295), set <code>CLERK_JWT_ISSUER</code> to the same instance (without the trailing slash is fine).</li>
          <li>Sign out/in, then refresh this page.</li>
        </ul>
      </section>
    </div>
  );
}
