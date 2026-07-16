import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { BookOpen, Calendar, ArrowRight, ChevronLeft, ChevronRight, PenLine, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Blog() {
  const [page, setPage] = useState(0);
  const limit = 9;

  const { data, isLoading } = trpc.blog.list.useQuery({
    limit,
    offset: page * limit,
  });

  const posts = data?.posts || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#111]">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />
        <div className="container py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              Sports Betting Insights
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              The ChalkPicks Blog
            </h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Expert analysis, betting strategies, and AI-powered insights to sharpen your edge.
            </p>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="container py-12 md:py-16">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/[0.02] border-white/5">
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white/60 mb-2">No articles yet</h2>
            <p className="text-white/40">Check back soon for expert sports betting content.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="bg-white/[0.02] border-white/5 hover:border-emerald-500/20 transition-all duration-300 cursor-pointer group overflow-hidden h-full">
                    {post.heroImage && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.heroImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    )}
                    <CardContent className="p-5 flex flex-col gap-3">
                      <h2 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-white/40 line-clamp-3">
                        {post.excerpt || post.seoDescription}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-white/30">
                          <Calendar className="w-3.5 h-3.5" />
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Recently"}
                        </div>
                        <span className="text-xs text-emerald-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Read <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="border-white/10 text-white/60"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <span className="text-sm text-white/40">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="border-white/10 text-white/60"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Write for Us Section */}
      <div className="border-t border-white/5 bg-gradient-to-b from-[#111] to-[#0d0d0d]">
        <div className="container py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-10 items-start">
              {/* Left: Pitch */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-5">
                  <PenLine className="w-3.5 h-3.5" />
                  Write for Us
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                  Share Your Edge with 10,000+ Bettors
                </h2>
                <p className="text-white/50 leading-relaxed mb-6">
                  ChalkPicks Pro publishes expert-level sports betting content — strategy breakdowns, handicapping guides, bankroll management, and data-driven analysis. If you have a proven edge and can write clearly, we want to hear from you.
                </p>
                <p className="text-white/40 text-sm leading-relaxed">
                  Contributors get a byline, author bio, and a link back to their site or social. High-quality pieces are promoted across our newsletter and social channels.
                </p>
              </div>

              {/* Right: Guidelines + CTA */}
              <div className="flex-1 space-y-6">
                <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5">
                  <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">Submission Guidelines</h3>
                  <ul className="space-y-3">
                    {[
                      "800–2,500 words, original and unpublished",
                      "Focus on NFL, NBA, MLB, NHL, or college sports",
                      "Data-backed arguments — no hot takes without evidence",
                      "No affiliate links or promotional content",
                      "Include a 1–2 sentence author bio",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-white/50">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="mailto:admin@chalkpicks.live?subject=Write%20for%20Us%20Submission&body=Hi%2C%0A%0AI'd%20like%20to%20contribute%20an%20article%20to%20ChalkPicks%20Pro.%0A%0AProposed%20title%3A%0ATopic%20summary%3A%0AWord%20count%20estimate%3A%0AAbout%20me%3A"
                  className="block"
                >
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <Mail className="w-4 h-4" />
                    Submit Your Pitch
                  </Button>
                </a>
                <p className="text-xs text-white/25 text-center">
                  Email admin@chalkpicks.live — we review all pitches within 5 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
