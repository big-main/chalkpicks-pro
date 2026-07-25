import { Link } from "wouter";
import Navbar from "@/components/Navbar";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-3xl py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-lime-400 transition-colors mb-8">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: July 25, 2026</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as your name, email address, and payment information when you create an account or subscribe. We also automatically collect usage data including pages visited, features used, pick interactions, and device/browser information to improve our Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to: provide and improve the Service; process payments and manage subscriptions; send transactional emails (pick alerts, receipts, account notices); personalize your experience and AI pick recommendations; analyze usage patterns to improve our models; and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Information Sharing</h2>
            <p>We do not sell your personal information. We share data only with: (a) service providers who help us operate the Service (Stripe for payments, email providers); (b) analytics providers to understand usage; (c) law enforcement when required by law. All third-party providers are bound by confidentiality agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to maintain your session, remember preferences, and analyze usage. You can control cookies through your browser settings, but disabling them may affect Service functionality. We use Google Analytics (GA4) for anonymous usage analytics.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active or as needed to provide services. Pick history and performance data may be retained indefinitely in anonymized form for model training. You may request deletion of your personal data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Security</h2>
            <p>We implement industry-standard security measures including encryption in transit (TLS), hashed passwords (bcrypt), and access controls. However, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password and enable two-factor authentication when available.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have rights to: access your personal data; correct inaccurate data; request deletion; opt out of marketing communications; and data portability. To exercise these rights, contact us at <a href="mailto:privacy@chalkpicks.live" className="text-lime-400 hover:underline">privacy@chalkpicks.live</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Children's Privacy</h2>
            <p>Our Service is not directed to individuals under 21 years of age. We do not knowingly collect personal information from minors. If we learn we have collected data from a minor, we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on our Service. Your continued use after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact Us</h2>
            <p>For privacy-related questions or requests, contact us at <a href="mailto:privacy@chalkpicks.live" className="text-lime-400 hover:underline">privacy@chalkpicks.live</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
