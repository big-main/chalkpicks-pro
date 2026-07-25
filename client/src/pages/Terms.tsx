import { Link } from "wouter";
import Navbar from "@/components/Navbar";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-3xl py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-lime-400 transition-colors mb-8">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: July 25, 2026</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using ChalkPicks Pro ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. These terms apply to all visitors, users, and others who access the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>ChalkPicks Pro provides AI-powered sports analytics, betting insights, and predictive modeling tools. Our Service is intended for informational and entertainment purposes only. We do not facilitate actual wagering or gambling transactions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Eligibility</h2>
            <p>You must be at least 21 years of age to use this Service. By using ChalkPicks Pro, you represent and warrant that you are 21 years of age or older and that you have the legal capacity to enter into these Terms. Use of this Service may be restricted or prohibited in certain jurisdictions — you are responsible for complying with local laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Subscriptions and Payments</h2>
            <p>ChalkPicks Pro offers subscription-based access to premium features. Subscriptions are billed on a recurring basis (daily, monthly, or annually) via Stripe. You may cancel your subscription at any time through your account settings. Refunds are not provided for partial billing periods. We reserve the right to change pricing with 30 days' notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Disclaimer of Warranties</h2>
            <p>The Service is provided "as is" without warranties of any kind. ChalkPicks Pro does not guarantee the accuracy, completeness, or usefulness of any analysis, pick, or prediction. Past performance does not guarantee future results. Sports betting involves inherent risk and variance — no system can guarantee profits.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
            <p>ChalkPicks Pro shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits or data, arising from your use of the Service. Our total liability to you for any claims shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>All content, features, and functionality of ChalkPicks Pro — including but not limited to text, graphics, logos, AI models, and software — are owned by ChalkPicks Pro and protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Prohibited Conduct</h2>
            <p>You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to gain unauthorized access to any portion of the Service; (c) scrape, harvest, or collect data from the Service without permission; (d) use automated tools to access the Service; (e) resell or redistribute our picks or analysis without written authorization.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Termination</h2>
            <p>We reserve the right to terminate or suspend your account at any time for violation of these Terms. Upon termination, your right to use the Service will immediately cease. All provisions that by their nature should survive termination shall survive.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes via email or a prominent notice on our Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
            <p>For questions about these Terms, please contact us at <a href="mailto:legal@chalkpicks.live" className="text-lime-400 hover:underline">legal@chalkpicks.live</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
