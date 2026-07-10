import { Link } from "wouter";
import { Handshake, ExternalLink, Star, Users, Globe, Megaphone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const partners = [
  {
    name: "ToolPilot.ai",
    logo: "/manus-storage/toolpilot-badge_17f2d7f0.jpg",
    url: "https://www.toolpilot.ai",
    description:
      "ToolPilot.ai is the leading AI tool discovery platform, helping users find the best AI-powered solutions for every need. ChalkPicks Pro is proudly featured as a top AI sports analytics tool on their platform.",
    badge: "Featured Partner",
    collaboration: [
      "Featured listing on ToolPilot.ai directory",
      "\"Featured On ToolPilot\" badge displayed on our site",
      "Cross-promotion on social media channels",
      "Exposure on ToolPilot Android and Apple apps",
    ],
  },
];

const collaborationOptions = [
  {
    icon: Globe,
    title: "Badge Placement",
    description:
      "Display our \"Powered by ChalkPicks\" badge on your website and link back to us for mutual SEO benefit.",
  },
  {
    icon: Megaphone,
    title: "Social Media Shoutouts",
    description:
      "Cross-promote through tweets, posts, retweets, and reposts to amplify our collective reach.",
  },
  {
    icon: Star,
    title: "Featured Product Reviews",
    description:
      "Get an extended product review featured on our blog and newsletter, reaching thousands of sports bettors.",
  },
  {
    icon: Users,
    title: "Blog & News Features",
    description:
      "Publish guest posts or get featured in our blog. We'll reciprocate with content on your platform.",
  },
];

export default function MediaPartners() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#111]">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-emerald-500/5" />
        <div className="container py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
              <Handshake className="w-3.5 h-3.5" />
              Partnerships
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Media Partners
            </h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              We collaborate with leading platforms in AI, sports analytics, and technology to deliver the best experience for our users.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Partners */}
      <div className="container py-12 md:py-16">
        <h2 className="text-2xl font-bold text-white mb-8">Featured Partners</h2>
        <div className="space-y-6">
          {partners.map((partner) => (
            <Card
              key={partner.name}
              className="bg-white/[0.02] border-white/5 overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="grid md:grid-cols-[280px_1fr] gap-0">
                  {/* Partner Logo Side */}
                  <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white/[0.03] to-transparent border-b md:border-b-0 md:border-r border-white/5">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="h-16 w-auto rounded-lg mb-4"
                    />
                    <h3 className="text-xl font-bold text-white mb-1">{partner.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {partner.badge}
                    </span>
                    <a
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-white/70 hover:text-white"
                      >
                        Visit Site <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </a>
                  </div>

                  {/* Partner Details */}
                  <div className="p-8">
                    <p className="text-white/60 leading-relaxed mb-6">
                      {partner.description}
                    </p>
                    <h4 className="text-sm font-semibold text-white/80 mb-3">
                      Our Collaboration
                    </h4>
                    <ul className="space-y-2">
                      {partner.collaboration.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-white/50"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Ways to Collaborate */}
      <div className="container py-12 md:py-16 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Ways to Collaborate</h2>
          <p className="text-white/50">
            Interested in partnering with ChalkPicks Pro? Here's how we can work together to grow our audiences.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {collaborationOptions.map((option) => (
            <Card
              key={option.title}
              className="bg-white/[0.02] border-white/5 hover:border-purple-500/20 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
                    <option.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">
                      {option.title}
                    </h3>
                    <p className="text-sm text-white/45 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Cooperation */}
      <div className="container py-12 md:py-16 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Additional Cooperation Options
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Banner placements on our platform",
              "Newsletter exposure to our subscriber base",
              "Extended product reviews and write-ups",
              "Blog/news posts featured on our site",
              "Exposure on partner Android & Apple apps",
              "Social media shoutouts, tweets, and reposts",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-emerald-500 shrink-0" />
                <span className="text-sm text-white/60">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container py-12 md:py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 to-emerald-500/10 border border-purple-500/20">
            <Mail className="w-10 h-10 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Become a Partner
            </h3>
            <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">
              Want to collaborate with ChalkPicks Pro? We're always looking for new partners in AI, sports, and technology. Reach out and let's grow together.
            </p>
            <a href="mailto:admin@chalkpicks.live?subject=Media Partnership Inquiry">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Mail className="w-4 h-4 mr-2" /> Contact Us About Partnerships
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
