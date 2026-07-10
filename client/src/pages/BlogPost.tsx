import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Calendar, BookOpen, Twitter, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Reddit SVG icon (not in lucide)
function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );
}

// Discord SVG icon
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";

  const { data: post, isLoading } = trpc.blog.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://chalkpicks.live/blog/${slug}`;

  const handleShareTwitter = () => {
    const text = post?.title
      ? `${post.title} — AI-powered sports betting insights from @ChalkPicksPro`
      : "Check out this article on ChalkPicks Pro";
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareReddit = () => {
    const title = post?.title || "ChalkPicks Pro — AI Sports Betting Analytics";
    const url = `https://reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(title)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareDiscord = async () => {
    const text = post?.title
      ? `📊 ${post.title}\n${pageUrl}`
      : pageUrl;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Discord-ready link copied! Paste it in your server.");
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
        {/* Back + Share Row */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> All Articles
            </Button>
          </Link>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 mr-1 hidden sm:inline">Share:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareTwitter}
              className="text-white/50 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors"
              title="Share on X (Twitter)"
            >
              <Twitter className="w-4 h-4" />
              <span className="ml-1.5 hidden sm:inline text-xs">X</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareReddit}
              className="text-white/50 hover:text-[#FF4500] hover:bg-[#FF4500]/10 transition-colors"
              title="Share on Reddit"
            >
              <RedditIcon className="w-4 h-4" />
              <span className="ml-1.5 hidden sm:inline text-xs">Reddit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareDiscord}
              className="text-white/50 hover:text-[#5865F2] hover:bg-[#5865F2]/10 transition-colors"
              title="Copy for Discord"
            >
              <DiscordIcon className="w-4 h-4" />
              <span className="ml-1.5 hidden sm:inline text-xs">Discord</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(pageUrl);
                  toast.success("Link copied to clipboard!");
                } catch {
                  toast.error("Failed to copy link");
                }
              }}
              className="text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Copy link"
            >
              <Link2 className="w-4 h-4" />
            </Button>
          </div>
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

        {/* Social Share Footer */}
        <div className="mt-12 p-5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">Found this helpful? Share it with your crew.</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareTwitter}
              className="border-[#1DA1F2]/30 text-[#1DA1F2] hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2]/60"
            >
              <Twitter className="w-3.5 h-3.5 mr-1.5" /> Post on X
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareReddit}
              className="border-[#FF4500]/30 text-[#FF4500] hover:bg-[#FF4500]/10 hover:border-[#FF4500]/60"
            >
              <RedditIcon className="w-3.5 h-3.5 mr-1.5" /> Reddit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareDiscord}
              className="border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/10 hover:border-[#5865F2]/60"
            >
              <DiscordIcon className="w-3.5 h-3.5 mr-1.5" /> Discord
            </Button>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
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
