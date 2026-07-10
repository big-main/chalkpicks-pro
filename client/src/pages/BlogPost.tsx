import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Calendar, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";

  const { data: post, isLoading } = trpc.blog.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#111]">
        <div className="container max-w-4xl py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#111] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Article Not Found</h1>
          <p className="text-white/40 mb-6">This article doesn't exist or has been removed.</p>
          <Link href="/blog">
            <Button variant="outline" className="border-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#111]">
      {/* SEO JSON-LD */}
      {post.jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: post.jsonLd }}
        />
      )}

      {/* Hero Image */}
      {post.heroImage && (
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img
            src={post.heroImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="container max-w-4xl py-8 md:py-12">
        {/* Back + Share */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> All Articles
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleShare} className="text-white/50 hover:text-white">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </div>

        {/* Title & Meta */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
          <div className="flex items-center gap-1.5 text-sm text-white/40">
            <Calendar className="w-4 h-4" />
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently Published"}
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Sports Betting
          </span>
        </div>

        {/* Article Body */}
        {post.contentHtml ? (
          <div
            className="prose prose-invert prose-emerald max-w-none
              prose-headings:text-white prose-headings:font-semibold
              prose-p:text-white/70 prose-p:leading-relaxed
              prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white/90
              prose-li:text-white/70
              prose-blockquote:border-emerald-500/30 prose-blockquote:text-white/60
              prose-img:rounded-xl prose-img:border prose-img:border-white/5"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        ) : post.content ? (
          <div className="text-white/70 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        ) : (
          <p className="text-white/40">No content available.</p>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">
            Ready to get AI-powered picks?
          </h3>
          <p className="text-sm text-white/50 mb-4">
            Join ChalkPicks Pro for data-driven sports betting analytics and daily AI picks.
          </p>
          <Link href="/pricing">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              View Plans
            </Button>
          </Link>
        </div>

        {/* Back to Blog */}
        <div className="mt-8 pt-8 border-t border-white/5">
          <Link href="/blog">
            <Button variant="ghost" className="text-white/50 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Articles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
