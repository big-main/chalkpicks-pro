import { useParams, Link } from "wouter";
import { LearnPageLayout } from "@/components/learn/LearnPageLayout";
import { LEARN_PAGES } from "@/data/learnPages";

/**
 * Single dynamic page for every /learn/:slug evergreen definitional page —
 * content lives in client/src/data/learnPages.tsx, keyed by slug.
 */
export default function LearnPage() {
  const { slug } = useParams<{ slug: string }>();
  const content = slug ? LEARN_PAGES[slug] : undefined;

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-slate-400 mb-6">
            That /learn article doesn't exist.
          </p>
          <Link href="/blog" className="text-emerald-400 hover:underline">
            Back to the blog
          </Link>
        </div>
      </div>
    );
  }

  return <LearnPageLayout {...content} />;
}
