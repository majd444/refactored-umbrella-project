import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Proaichats",
  description:
    "Privacy Policy for Proaichats. Learn what data we collect, how we use it, retention, security, third-party services, children's privacy, your rights, and contact info.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="container mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">🔒 Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: October 2025</p>

        <p className="mb-6">
          Welcome to <strong>Proaichats</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform, applications, or Discord integrations (collectively, the &quot;Service&quot;). By using our Service, you agree to the terms of this Privacy Policy.
        </p>

        <div className="space-y-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
            <h3 className="font-medium mb-1">a. Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Account registration details (name, email address, password, company name).</li>
              <li>Information submitted through forms or during chatbot setup.</li>
              <li>Payment and billing details (processed securely by our third-party payment provider).</li>
            </ul>
            <h3 className="font-medium mb-1">b. Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Log data such as IP address, browser type, and device information.</li>
              <li>Usage data about how you interact with our Service and connected chatbots.</li>
              <li>Discord-related information such as server ID, user ID, and messages only when required for bot operation.</li>
            </ul>
            <h3 className="font-medium mb-1">c. Data from Third-Party Integrations</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>When you connect Discord or another platform: we may access necessary identifiers (server ID, channel ID, etc.).</li>
              <li>We do not access private messages or store unnecessary user data.</li>
              <li>All integrations follow Discord’s Developer Terms and API rules.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Operate and improve our chatbot services.</li>
              <li>Personalize responses and maintain user settings.</li>
              <li>Communicate important updates or security notices.</li>
              <li>Prevent abuse and ensure compliance with platform policies.</li>
            </ul>
            <p className="mt-2">We <strong>never sell or trade</strong> your personal data to advertisers or third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Data Retention</h2>
            <p>
              We retain your data only as long as necessary to provide the Service or comply with legal obligations. You may request deletion of your account and data at any time by contacting <a className="text-blue-600 underline" href="mailto:support@proaichats.com">support@proaichats.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Data Security</h2>
            <p>
              We implement reasonable technical and organizational measures to protect your data from unauthorized access, alteration, or disclosure. However, no online service is completely secure — by using our Service, you acknowledge this risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Third-Party Services</h2>
            <p>
              Our Service may link or connect to Discord, OpenAI, Google Cloud, and other APIs. These services operate under their own privacy policies, and we are not responsible for their practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Children’s Privacy</h2>
            <p>
              Our Service is not directed to children under 13 (or the minimum legal age in your country). We do not knowingly collect information from minors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Your Rights</h2>
            <p className="mb-2">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access, correct, or delete your data.</li>
              <li>Withdraw consent for data processing.</li>
              <li>Request a copy of the information we store.</li>
            </ul>
            <p className="mt-2">To exercise these rights, email <a className="text-blue-600 underline" href="mailto:privacy@proaichats.com">privacy@proaichats.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy occasionally. When we do, we’ll post the updated version on this page with a new &quot;Last updated&quot; date. Continued use of the Service means you accept the updated version.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contact Us</h2>
            <ul className="list-none pl-0">
              <li>📧 <a className="text-blue-600 underline" href="mailto:privacy@proaichats.com">privacy@proaichats.com</a></li>
              <li>🌐 <a className="text-blue-600 underline" href="https://www.proaichats.com" target="_blank" rel="noopener noreferrer">https://www.proaichats.com</a></li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
