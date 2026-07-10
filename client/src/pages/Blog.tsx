import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { blogPosts } from "@/data/blog-posts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChevronRight } from "lucide-react";

export default function Blog() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Sports Betting Analytics Blog — Strategy & AI Insights | ChalkPicks"
        description="Advanced sports betting strategy, +EV concepts, bankroll management, and AI betting analytics from the ChalkPicks team."
        canonicalPath="/blog"
      />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl mt-20">
        <div className="mb-12 text-center">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Exo 2', sans-serif", color: "#00ff88", textShadow: "0 0 20px rgba(0,255,136,0.3)" }}
          >
            ChalkPicks <span className="text-white">Blog</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced strategies, +EV betting concepts, and the latest in AI sports analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card
                className="h-full bg-card border-border hover:border-primary/60 transition-all duration-300 cursor-pointer group"
                style={{ background: "rgba(12,12,28,0.8)" }}
              >
                <CardHeader>
                  <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" }}
                    >
                      {post.category}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(post.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime} min read
                      </span>
                    </div>
                  </div>
                  <CardTitle
                    className="text-xl leading-tight text-white group-hover:text-[#00ff88] transition-colors"
                    style={{ fontFamily: "'Exo 2', sans-serif" }}
                  >
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">{post.description}</p>
                  <div
                    className="flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform"
                    style={{ color: "#00d4ff" }}
                  >
                    Read Article <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div
          className="mt-16 p-8 rounded-xl text-center"
          style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}
        >
          <h2 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            Put the Strategies Into Action
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            ChalkPicks gives you AI picks, a real-time +EV finder, arbitrage scanner, and pro bankroll tools — everything covered in these guides.
          </p>
          <Link href="/signup">
            <button
              className="px-8 py-3 font-bold rounded-lg transition-all"
              style={{
                background: "#00ff88",
                color: "#080814",
                fontFamily: "'Exo 2', sans-serif",
                boxShadow: "0 0 20px rgba(0,255,136,0.35)",
                border: "none",
                cursor: "pointer",
              }}
            >
              GET STARTED FREE
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
