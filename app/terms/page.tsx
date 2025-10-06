import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Proaichats",
  description:
    "Terms of Service for Proaichats. Learn about eligibility, acceptable use, data, payment, availability, liability, termination, and more.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="container mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">🧾 Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: October 2025</p>

        <p className="mb-6">
          Welcome to <strong>Proaichats</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to and use of our platform, software, APIs, and Discord integration (collectively, the &quot;Service&quot;). By accessing or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
        </p>

        <div className="space-y-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Service Overview</h2>
            <p>
              Proaichats provides a platform that allows users to create and manage AI-powered chatbots and voice agents. Users may connect their chatbots to third-party platforms such as Discord, WhatsApp, Messenger, or websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be at least 13 years old (or the minimum age required by your country’s laws).</li>
              <li>Have a valid account and agree to provide accurate information.</li>
              <li>Comply with all applicable local laws, including Discord’s Developer Terms and Community Guidelines.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Account Registration</h2>
            <p>
              You are responsible for maintaining the security of your account credentials. You agree not to share your login details or API keys with unauthorized parties. We are not liable for any loss resulting from unauthorized access to your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Acceptable Use</h2>
            <p className="mb-2">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Send spam or unsolicited messages.</li>
              <li>Generate or distribute illegal, harmful, or misleading content.</li>
              <li>Violate Discord’s Terms of Service or any third-party platform rules.</li>
              <li>Collect or store personal data without consent.</li>
              <li>Attempt to disrupt or abuse the Service (e.g., rate-limit evasion, scraping, or hacking).</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or terminate accounts that violate these rules.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. User Content and Data</h2>
            <p>
              You retain ownership of the content and data you upload or provide to your chatbot. By using the Service, you grant Proaichats a non-exclusive, worldwide license to process, store, and use that data solely for operating and improving the Service. We do not sell or share user data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Integrations (Discord and Others)</h2>
            <p>
              When connecting your bot to Discord or another platform, you acknowledge that you must comply with that platform’s policies. Proaichats is not responsible for issues, suspensions, or data handled by third-party platforms. Discord, WhatsApp, and other connected platforms may process data independently under their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Payment and Subscription</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fees are billed in advance according to the chosen subscription cycle.</li>
              <li>You may cancel anytime; however, no refunds are provided for partial periods.</li>
              <li>Prices and features may change with notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Service Availability</h2>
            <p>
              We aim to maintain high uptime but do not guarantee uninterrupted access. Maintenance, technical issues, or third-party outages (like Discord or OpenAI) may temporarily affect functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages. Our total liability for any claim related to the Service will not exceed the amount paid by you in the last 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">10. Termination</h2>
            <p>
              We may suspend or terminate your account if you violate these Terms, or misuse the Service (e.g., sending spam or breaching Discord rules). You may delete your account at any time from your dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">11. Intellectual Property</h2>
            <p>
              All trademarks, logos, and software components of Proaichats remain our exclusive property. You may not copy, modify, or redistribute the Service without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">12. Changes to the Terms</h2>
            <p>
              We may update these Terms periodically. When we do, we’ll post the new version on our website with a revised &quot;Last updated&quot; date. Continued use of the Service after an update constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">13. Contact</h2>
            <p className="mb-1">If you have questions about these Terms, please contact us at:</p>
            <ul className="list-none pl-0">
              <li>📧 <a className="text-blue-600 underline" href="mailto:support@proaichats.com">support@proaichats.com</a></li>
              <li>🌐 <a className="text-blue-600 underline" href="https://www.proaichats.com" target="_blank" rel="noopener noreferrer">https://www.proaichats.com</a></li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              Discord requires both a Terms of Service and a Privacy Policy. If you need a matching Privacy Policy, let us know and we can provide it.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
