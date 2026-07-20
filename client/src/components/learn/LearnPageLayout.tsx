import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/schema-jsonld";

/** Styled in-body link to another ChalkPicks page — shared so section prose doesn't repeat the className. */
export function InternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className="text-emerald-400 hover:underline">
      {children}
    </a>
  );
}

export interface LearnFaq {
  question: string;
  answer: string;
}

export interface LearnSection {
  title: string;
  body: ReactNode;
}

interface LearnPageLayoutProps {
  path: string;
  badge: string;
  title: string;
  intro: string;
  sections: LearnSection[];
  faqs: LearnFaq[];
  /** Show the CTA into the live bet calculator — on by default. */
  showCalculator?: boolean;
}

/**
 * Shared shell for the /learn/* evergreen definitional pages (closing line
 * value, no-vig odds, Kelly criterion, line movement / steam). These are the
 * pages meant to be cited by AI answer engines for years, so every instance
 * carries FAQPage + Breadcrumb JSON-LD and a live calculator, not just prose.
 */
export function LearnPageLayout({
  path,
  badge,
  title,
  intro,
  sections,
  faqs,
  showCalculator = true,
}: LearnPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://chalkpicks.live" },
          { name: "Learn", url: "https://chalkpicks.live/learn" },
          { name: title, url: `https://chalkpicks.live${path}` },
        ]}
      />
      <FaqJsonLd faqs={faqs} />

      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-700">
            {badge}
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {title}
          </h1>
          <p className="text-xl text-slate-300 mb-8">{intro}</p>
          <Link href="/picks">
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              See Today's AI Picks <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {sections.map(section => (
            <Card
              key={section.title}
              className="border-slate-700 bg-slate-800/50"
            >
              <CardHeader>
                <CardTitle className="text-2xl text-emerald-400">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-300">
                {section.body}
              </CardContent>
            </Card>
          ))}

          {faqs.length > 0 && (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-2xl text-emerald-400">FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {faqs.map(faq => (
                  <div key={faq.question}>
                    <h4 className="font-semibold text-white mb-1">
                      {faq.question}
                    </h4>
                    <p className="text-sm text-slate-400">{faq.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showCalculator && (
        <div className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Card className="border-emerald-700/50 bg-emerald-500/10">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                <div className="flex items-center gap-3">
                  <Calculator className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white">
                      Run the numbers yourself
                    </h3>
                    <p className="text-sm text-slate-400">
                      Free bet calculator: odds conversion, parlay payouts, and
                      Kelly bet sizing.
                    </p>
                  </div>
                </div>
                <Link href="/bet-calculator">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 shrink-0">
                    Open Bet Calculator <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
