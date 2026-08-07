import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — NautIQ",
  description: "NautIQ Privacy Policy",
};

const EFFECTIVE_DATE = "7 August 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-ocean-600 hover:underline">← Back to NautIQ</Link>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">1. Who we are</h2>
            <p>NautIQ is a boat management service. When we say "we", "us", or "NautIQ" we mean the NautIQ service and its operators. Contact us at <a href="mailto:support@nautiq.cloud" className="text-ocean-600 hover:underline">support@nautiq.cloud</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">2. What data we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> email address and password (hashed) when you sign up.</li>
              <li><strong>Boat data:</strong> boat name, type, specs, components, maintenance records, inventory, and trips that you enter.</li>
              <li><strong>Email content:</strong> if you email log@nautiq.cloud, we store the subject and body to create maintenance drafts.</li>
              <li><strong>Photos:</strong> maintenance photos you attach to records, stored in encrypted cloud storage.</li>
              <li><strong>Usage data:</strong> basic server logs (IP address, request timestamps) for security and debugging.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve the NautIQ service.</li>
              <li>To send email notifications you have configured (health summaries, overdue alerts).</li>
              <li>To process your data through AI models (Anthropic Claude) for chat responses, email parsing, and maintenance suggestions.</li>
              <li>To diagnose errors and maintain service security.</li>
            </ul>
            <p className="mt-3">We do not sell your data. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">4. Third-party services</h2>
            <p>We use the following third-party services to operate NautIQ:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — database and file storage (EU/US)</li>
              <li><strong>Vercel</strong> — hosting and serverless functions (global CDN)</li>
              <li><strong>Anthropic</strong> — AI chat and email parsing</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
            </ul>
            <p className="mt-3">Each provider has their own privacy policy governing their data handling.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">5. Data retention</h2>
            <p>We retain your data for as long as your account is active. When you delete your account from Settings, all your boat data, maintenance records, inventory, trips, and photos are permanently deleted within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">6. Your rights</h2>
            <p>You have the right to access, correct, export, or delete your data. You can manage most of this from within the app. For requests you can't complete in-app, email <a href="mailto:support@nautiq.cloud" className="text-ocean-600 hover:underline">support@nautiq.cloud</a> and we will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">7. Security</h2>
            <p>We use industry-standard security practices including encrypted data at rest, HTTPS for all connections, and row-level security in our database so users can only access their own data.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">8. Cookies</h2>
            <p>We use a single session cookie to keep you signed in. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">9. Children</h2>
            <p>NautIQ is not directed at children under 18. We do not knowingly collect data from anyone under 18.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">10. Changes to this policy</h2>
            <p>We may update this policy. We will notify you of material changes via email. Continued use of NautIQ after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">11. Contact</h2>
            <p>Privacy questions or requests: <a href="mailto:support@nautiq.cloud" className="text-ocean-600 hover:underline">support@nautiq.cloud</a>.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex gap-4 text-sm text-slate-400">
          <Link href="/legal/terms" className="hover:text-ocean-600">Terms of Service</Link>
          <Link href="/" className="hover:text-ocean-600">Back to NautIQ</Link>
        </div>
      </div>
    </div>
  );
}
