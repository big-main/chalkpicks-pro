import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface StoryCard {
  id: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  recommendation: string;
  confidenceScore: number;
  result: string;
  s3Url: string | null;
  generatedAt: Date | string;
  postedToInstagram: boolean;
}

export default function StoryHistory() {
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const { data: historyData, isLoading, refetch } = trpc.storyHistory.getHistory.useQuery({
    limit: 12,
    offset: page * 12,
    sport: selectedSport || undefined,
  });

  const { data: statsData } = trpc.storyHistory.getStats.useQuery();

  const deleteMutation = trpc.storyHistory.deleteStory.useMutation({
    onSuccess: () => {
      toast.success("Story deleted");
      refetch();
    },
    onError: (err) => {
      toast.error(`Delete failed: ${err.message}`);
    },
  });

  const markPostedMutation = trpc.storyHistory.markAsPosted.useMutation({
    onSuccess: () => {
      toast.success("Story marked as posted!");
      refetch();
    },
    onError: (err) => {
      toast.error(`Update failed: ${err.message}`);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Delete this story from history?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleMarkPosted = (id: number) => {
    markPostedMutation.mutate({ id });
  };

  const stories = (historyData?.stories ?? []) as StoryCard[];
  const total = historyData?.total ?? 0;

  const resultColor: Record<string, string> = {
    win: "#39ff14",
    loss: "#e63946",
    push: "#f0b800",
    pending: "rgba(200,210,230,0.5)",
  };

  const resultLabel: Record<string, string> = {
    win: "✅ Win",
    loss: "❌ Loss",
    push: "➡️ Push",
    pending: "⏳ Pending",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "white", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0a0a0f 0%, #0d1520 50%, #0a0a0f 100%)",
        borderBottom: "1px solid rgba(212,160,23,0.15)",
        padding: "60px 24px 48px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 250, background: "radial-gradient(ellipse, rgba(212,160,23,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)",
          borderRadius: 20, padding: "6px 16px", marginBottom: 20,
          fontSize: 12, fontWeight: 700, color: "#f0b800", letterSpacing: "0.1em",
        }}>
          📚 STORY HISTORY
        </div>

        <h1 style={{
          fontFamily: "'Oswald', sans-serif",
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          fontWeight: 700,
          margin: "0 0 12px",
          letterSpacing: "0.02em",
          background: "linear-gradient(135deg, #d4a017, #f0b800, #d4a017)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Story History
        </h1>
        <p style={{ fontSize: "1rem", color: "rgba(200,210,230,0.55)", maxWidth: 520, margin: "0 auto" }}>
          View all generated Instagram stories, track posting history, and manage your content library.
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>

        {/* Stats Cards */}
        {statsData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
            <div style={{
              background: "rgba(57,255,20,0.08)",
              border: "1px solid rgba(57,255,20,0.25)",
              borderRadius: 12,
              padding: 20,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#39ff14", marginBottom: 4 }}>
                {statsData.totalGenerated}
              </div>
              <div style={{ fontSize: 12, color: "rgba(200,210,230,0.5)", fontWeight: 700, letterSpacing: "0.05em" }}>
                TOTAL GENERATED
              </div>
            </div>

            <div style={{
              background: "rgba(212,160,23,0.08)",
              border: "1px solid rgba(212,160,23,0.25)",
              borderRadius: 12,
              padding: 20,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#f0b800", marginBottom: 4 }}>
                {statsData.totalPosted}
              </div>
              <div style={{ fontSize: 12, color: "rgba(200,210,230,0.5)", fontWeight: 700, letterSpacing: "0.05em" }}>
                POSTED TO IG
              </div>
            </div>

            <div style={{
              background: "rgba(30,144,255,0.08)",
              border: "1px solid rgba(30,144,255,0.25)",
              borderRadius: 12,
              padding: 20,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#1e90ff", marginBottom: 4 }}>
                {statsData.winRate}%
              </div>
              <div style={{ fontSize: 12, color: "rgba(200,210,230,0.5)", fontWeight: 700, letterSpacing: "0.05em" }}>
                WIN RATE
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ marginBottom: 32, display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(200,210,230,0.55)", letterSpacing: "0.05em" }}>
            FILTER BY SPORT:
          </label>
          <select
            value={selectedSport}
            onChange={e => {
              setSelectedSport(e.target.value);
              setPage(0);
            }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "8px 12px",
              color: "#f0f2f5",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <option value="">All Sports</option>
            <option value="nfl">NFL</option>
            <option value="nba">NBA</option>
            <option value="mlb">MLB</option>
            <option value="nhl">NHL</option>
            <option value="ncaaf">NCAAF</option>
            <option value="ncaab">NCAAB</option>
            <option value="soccer">Soccer</option>
            <option value="mma">MMA</option>
          </select>
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "rgba(200,210,230,0.5)" }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
            <div>Loading stories...</div>
          </div>
        ) : stories.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 24px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 16,
            border: "1px dashed rgba(255,255,255,0.1)",
            color: "rgba(200,210,230,0.5)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No stories yet</div>
            <div style={{ fontSize: 13 }}>Generate your first Instagram story to see it here</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
              {stories.map(story => (
                <div
                  key={story.id}
                  onClick={() => setExpandedId(expandedId === story.id ? null : story.id)}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    transform: expandedId === story.id ? "scale(1.02)" : "scale(1)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,160,23,0.25)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                  }}
                >
                  {/* Thumbnail */}
                  {story.s3Url ? (
                    <img
                      src={story.s3Url}
                      alt={`${story.awayTeam} vs ${story.homeTeam}`}
                      style={{
                        width: "100%",
                        height: 300,
                        objectFit: "cover",
                        background: "#0d0f14",
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: 300,
                      background: "#0d0f14",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(200,210,230,0.3)",
                      fontSize: 48,
                    }}>
                      📸
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(200,210,230,0.4)", marginBottom: 4, letterSpacing: "0.05em" }}>
                          {story.sport.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f2f5", lineHeight: 1.3 }}>
                          {story.awayTeam} vs {story.homeTeam}
                        </div>
                      </div>
                      <div
                        style={{
                          background: resultColor[story.result] + "20",
                          color: resultColor[story.result],
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {resultLabel[story.result]}
                      </div>
                    </div>

                    <div style={{
                      fontSize: 12,
                      color: "rgba(200,210,230,0.6)",
                      marginBottom: 12,
                      display: "flex",
                      justifyContent: "space-between",
                    }}>
                      <span>{story.recommendation}</span>
                      <span style={{ color: "#39ff14", fontWeight: 700 }}>{story.confidenceScore}%</span>
                    </div>

                    <div style={{
                      fontSize: 11,
                      color: "rgba(200,210,230,0.4)",
                      marginBottom: 12,
                    }}>
                      {new Date(story.generatedAt).toLocaleDateString()} · {new Date(story.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>

                    {expandedId === story.id && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                        {!story.postedToInstagram && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleMarkPosted(story.id);
                            }}
                            style={{
                              flex: 1,
                              background: "rgba(212,160,23,0.1)",
                              border: "1px solid rgba(212,160,23,0.3)",
                              borderRadius: 6,
                              padding: "6px 12px",
                              color: "#f0b800",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              letterSpacing: "0.05em",
                            }}
                          >
                            📤 Mark Posted
                          </button>
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(story.id);
                          }}
                          style={{
                            flex: 1,
                            background: "rgba(230,57,70,0.1)",
                            border: "1px solid rgba(230,57,70,0.3)",
                            borderRadius: 6,
                            padding: "6px 12px",
                            color: "#e63946",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            letterSpacing: "0.05em",
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  style={{
                    background: page === 0 ? "rgba(255,255,255,0.05)" : "rgba(212,160,23,0.1)",
                    border: page === 0 ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(212,160,23,0.3)",
                    borderRadius: 8,
                    padding: "8px 16px",
                    color: page === 0 ? "rgba(200,210,230,0.3)" : "#f0b800",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: page === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Previous
                </button>
                <div style={{ fontSize: 12, color: "rgba(200,210,230,0.5)" }}>
                  Page {page + 1} of {Math.ceil(total / 12)}
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 12 >= total}
                  style={{
                    background: (page + 1) * 12 >= total ? "rgba(255,255,255,0.05)" : "rgba(212,160,23,0.1)",
                    border: (page + 1) * 12 >= total ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(212,160,23,0.3)",
                    borderRadius: 8,
                    padding: "8px 16px",
                    color: (page + 1) * 12 >= total ? "rgba(200,210,230,0.3)" : "#f0b800",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: (page + 1) * 12 >= total ? "not-allowed" : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
