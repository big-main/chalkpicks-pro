import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Check, CheckCheck, Trash2, Eye, Edit2 } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTopic, setSelectedTopic] = useState("sports betting strategies");
  const [isGenerating, setIsGenerating] = useState(false);

  // Queries
  const { data: allPosts, isLoading: isLoadingPosts, refetch: refetchPosts } = trpc.blog.listAll.useQuery({
    limit: 50,
    offset: 0,
  });

  // Mutations
  const generateMutation = trpc.blog.generateFromPick.useMutation({
    onSuccess: () => {
      setIsGenerating(false);
      refetchPosts();
    },
    onError: (error: any) => {
      setIsGenerating(false);
      alert(`Error: ${error.message}`);
    },
  });

  const publishMutation = trpc.blog.publish.useMutation({
    onSuccess: () => {
      refetchPosts();
    },
  });

  const publishAllCleanMutation = trpc.blog.publishAllClean.useMutation({
    onSuccess: (result) => {
      refetchPosts();
      const skippedNote =
        result.skipped.length > 0
          ? `\nSkipped ${result.skipped.length}: ${result.skipped.map((s) => `${s.slug} (${s.reason})`).join("; ")}`
          : "";
      alert(`Published ${result.publishedCount} draft(s).${skippedNote}`);
    },
    onError: (error: any) => {
      alert(`Error: ${error.message}`);
    },
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      refetchPosts();
    },
  });

  // Redirect non-admins
  if (!user?.role || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-red-600 font-semibold">Access Denied</p>
          <p className="text-sm text-gray-600 mt-2">Only admins can manage blog content</p>
        </Card>
      </div>
    );
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    await generateMutation.mutateAsync({
      pickId: 1, // Generate from latest pick
    });
  };

  const handlePublish = (id: number) => {
    publishMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this blog post?")) {
      deleteMutation.mutate({ id });
    }
  };

  const drafts = allPosts?.posts?.filter((p) => p.status === "draft") || [];
  const published = allPosts?.posts?.filter((p) => p.status === "published") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Blog Management</h1>
          <p className="text-gray-400">Generate and manage sports betting blog content</p>
        </div>

        {/* Generate Section */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Generate New Articles</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
              <Input
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                placeholder="e.g., sports betting strategies"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || generateMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isGenerating || generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate 5 Articles"
              )}
            </Button>
          </div>
        </Card>

        {/* Drafts Section */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Drafts ({drafts.length})
            </h2>
            <Button
              size="sm"
              onClick={() => publishAllCleanMutation.mutate()}
              disabled={drafts.length === 0 || publishAllCleanMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {publishAllCleanMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4 mr-2" />
              )}
              Publish All Clean Drafts
            </Button>
          </div>
          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : drafts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No draft articles</p>
          ) : (
            <div className="space-y-3">
              {drafts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{post.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{post.slug}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePublish(post.id)}
                      className="border-green-500 text-green-400 hover:bg-green-500/10"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(post.id)}
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Published Section */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Published ({published.length})
          </h2>
          {published.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No published articles</p>
          ) : (
            <div className="space-y-3">
              {published.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{post.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{post.slug}</p>
                    {post.publishedAt && (
                      <p className="text-xs text-gray-500">
                        Published: {new Date(post.publishedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/blog/${post.slug}`)}
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(post.id)}
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
