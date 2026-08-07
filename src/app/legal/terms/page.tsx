import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — NautIQ",
  description: "NautIQ Terms of Service",
};

const EFFECTIVE_DATE = "7 August 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-ocean-600 hover:underline">← Back to NautIQ</Link>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">1. Acceptance</h2>
            <p>By creating a NautIQ account or using our services, you agree to these Terms of Service. If you do not agree, do not use NautIQ.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">2. Description of service</h2>
            <p>NautIQ is a boat management platform that helps you track maintenance, inventory, trips, and boat health. We use AI to assist with logging, parsing emails, and answering questions about your boat.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">3. Your account</h2>
            <p>You are responsible for keeping your account credentials secure. You must be 18 or older to use NautIQ. You may not share your account with others or use it for commercial resale.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">4. Your data</h2>
            <p>You own the data you enter into NautIQ. By using the service you grant us a limited licence to store and process your data in order to provide the service. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">5. AI-generated content</h2>
            <p>NautIQ uses AI to assist with maintenance suggestions, email parsing, and health assessments. AI responses may be inaccurate. Always verify safety-critical information with a qualified marine professional. NautIQ is not a substitute for professional marine advice.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">6. Acceptable use</h2>
            <p>You agree not to: attempt to reverse-engineer or exploit the platform; use the service to harass or harm others; upload illegal content; or attempt to circumvent any security measures.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">7. Availability</h2>
            <p>We aim to keep NautIQ available at all times but do not guarantee uninterrupted access. We may update, modify, or discontinue features with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">8. Limitation of liability</h2>
            <p>NautIQ is provided "as is". To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">9. Termination</h2>
            <p>You may delete your account at any time from Settings. We may suspend or terminate accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">10. Changes to these terms</h2>
            <p>We may update these terms from time to time. We will notify you of material changes via email or in-app notification. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">11. Contact</h2>
            <p>Questions about these terms? Email us at <a href="mailto:support@nautiq.cloud" className="text-ocean-600 hover:underline">support@nautiq.cloud</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex gap-4 text-sm text-slate-400">
          <Link href="/legal/privacy" className="hover:text-ocean-600">Privacy Policy</Link>
          <Link href="/" className="hover:text-ocean-600">Back to NautIQ</Link>
        </div>
      </div>
    </div>
  );
}
