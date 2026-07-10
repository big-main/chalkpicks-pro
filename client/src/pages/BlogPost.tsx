import { useParams, Link } from "wouter";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { blogPosts } from "@/data/blog-posts";
import NotFound from "@/pages/NotFound";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, User, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SCHEMA_ID = "blog-post-schema";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === params.slug);

  // Inject Article structured data
  useEffect(() => {
    if (!post) return;
    const existing = document.getElementById(SCHEMA_ID);
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = SCHEMA_ID;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: { "@type": "Organization", name: "ChalkPicks" },
      publisher: {
        "@type": "Organization",
        name: "ChalkPicks",
        url: "https://chalkpicks.live",
      },
      mainEntityOfPage: `https://chalkpicks.live/blog/${post.slug}`,
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById(SCHEMA_ID)?.remove();
    };
  }, [post]);

  if (!post) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title={`${post.title} | ChalkPicks Blog`}
        description={post.description}
        canonicalPath={`/blog/${post.slug}`}
      />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl mt-20">
        <Link
          href="/blog"
          className="inline-flex items-center text-muted-foreground hover:text-[#00ff88] mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
        </Link>

        <article>
          <header className="mb-10 pb-8" style={{ borderBottom: "1px solid rgba(0,255,136,0.15)" }}>
            <Badge
              variant="secondary"
              className="mb-4"
              style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" }}
            >
              {post.category}
            </Badge>
            <h1
              className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-white"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4 md:gap-6">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" style={{ color: "#00ff88" }} /> {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: "#00d4ff" }} />{" "}
                {new Date(post.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: "#a855f7" }} /> {post.readTime} min read
              </span>
            </div>
          </header>

          <div className="blog-content" style={{ fontFamily: "'Inter', sans-serif" }}>
            <ReactMarkdown
              components={{
                h1: () => null, // H1 already rendered in the header above
                h2: ({ children }) => (
                  <h2
                    className="text-2xl font-bold mt-10 mb-4 text-white"
                    style={{ fontFamily: "'Exo 2', sans-serif" }}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3
                    className="text-xl font-semibold mt-8 mb-3"
                    style={{ fontFamily: "'Exo 2', sans-serif", color: "#00d4ff" }}
                  >
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-6 leading-relaxed" style={{ color: "rgba(210,210,228,0.85)" }}>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mb-6 space-y-2" style={{ color: "rgba(210,210,228,0.85)" }}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mb-6 space-y-2" style={{ color: "rgba(210,210,228,0.85)" }}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                a: ({ href, children }) => {
                  const isInternal = typeof href === "string" && href.startsWith("/");
                  if (isInternal) {
                    return (
                      <Link
                        href={href}
                        className="font-medium hover:underline"
                        style={{ color: "#00ff88" }}
                      >
                        {children}
                      </Link>
                    );
                  }
                  return (
                    <a
                      href={href}
                      className="font-medium hover:underline"
                      style={{ color: "#00ff88" }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  );
                },
                strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                em: ({ children }) => <em style={{ color: "rgba(210,210,228,0.95)" }}>{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote
                    className="pl-4 my-6 italic"
                    style={{ borderLeft: "3px solid #00ff88", color: "rgba(200,200,220,0.7)" }}
                  >
                    {children}
                  </blockquote>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        {/* CTA */}
        <div
          className="mt-16 p-8 rounded-xl text-center"
          style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}
        >
          <h2 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            Ready to Bet Smarter?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join thousands of data-driven bettors using ChalkPicks' AI picks, +EV finder, arbitrage scanner, and real-time analytics.
          </p>
          <Link href="/signup">
            <button
              className="inline-flex items-center gap-2 px-8 py-3 font-bold rounded-lg transition-all"
              style={{
                background: "#00ff88",
                color: "#080814",
                fontFamily: "'Exo 2', sans-serif",
                boxShadow: "0 0 20px rgba(0,255,136,0.35)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Zap className="w-4 h-4" />
              START FREE
            </button>
          </Link>
        </div>

        {/* Related posts */}
        <div className="mt-12 mb-8">
          <h2 className="text-xl font-bold mb-6 text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            More From the Blog
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {blogPosts
              .filter((p) => p.slug !== post.slug)
              .slice(0, 4)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="block p-4 rounded-lg transition-all hover:translate-y-[-2px]"
                  style={{ background: "rgba(12,12,28,0.8)", border: "1px solid rgba(0,255,136,0.12)" }}
                >
                  <div className="text-sm font-semibold text-white mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    {p.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.readTime} min read</div>
                </Link>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
