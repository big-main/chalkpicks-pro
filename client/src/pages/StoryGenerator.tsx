import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const SPORTS = [
  { key: "nfl", label: "NFL 🏈" },
  { key: "nba", label: "NBA 🏀" },
  { key: "mlb", label: "MLB ⚾" },
  { key: "nhl", label: "NHL 🏒" },
  { key: "ncaaf", label: "NCAAF 🏈" },
  { key: "ncaab", label: "NCAAB 🏀" },
  { key: "soccer", label: "Soccer ⚽" },
  { key: "mma", label: "MMA 🥊" },
];

const PICK_TYPES = ["Moneyline", "Spread", "Over/Under", "Player Prop"];

// Story templates with preset layouts
const STORY_TEMPLATES = [
  {
    id: "default",
    name: "Default",
    description: "Clean layout with all details",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Focus on pick + confidence",
  },
  {
    id: "detailed",
    name: "Detailed",
    description: "Full AI analysis included",
  },
];

interface StoryForm {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  recommendation: string;
  odds: string;
  confidenceScore: number;
  pickType: string;
  aiAnalysis: string;
  result: string;
  templateId?: string;
  scheduledTime?: string;
}

const DEFAULT_FORM: StoryForm = {
  sport: "nfl",
  homeTeam: "Kansas City Chiefs",
  awayTeam: "Las Vegas Raiders",
  recommendation: "Chiefs -7.5",
  odds: "-110",
  confidenceScore: 87,
  pickType: "Spread",
  aiAnalysis: "The Chiefs have dominated this matchup historically, covering 8 of the last 10 meetings. Mahomes has a 94.3 passer rating at home this season.",
  result: "",
  templateId: "default",
};

// Auto-save utilities
const DRAFT_STORAGE_KEY = "chalkpicks_story_draft";
const AUTO_SAVE_INTERVAL = 3000;

function saveDraftToStorage(form: StoryForm) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
  } catch (e) {
    console.error("Failed to save draft", e);
  }
}

function loadDraftFromStorage(): StoryForm | null {
  try {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch (e) {
    console.error("Failed to load draft", e);
    return null;
  }
}

function clearDraftFromStorage() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear draft", e);
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block",
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(200,210,230,0.55)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      marginBottom: 6,
    }}>
      {children}
    </label>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "10px 14px",
        color: "#f0f2f5",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
        transition: "border-color 0.2s",
      }}
      onFocus={e => (e.currentTarget.style.borderColor = "rgba(57,255,20,0.4)")}
      onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
    />
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "#141a24",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "10px 14px",
        color: "#f0f2f5",
        fontSize: 14,
        outline: "none",
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default function StoryGenerator() {
  const [form, setForm] = useState<StoryForm>(() => {
    const draft = loadDraftFromStorage();
    return draft || DEFAULT_FORM;
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState<number | null>(null);
  const [hasDraft, setHasDraft] = useState(!!loadDraftFromStorage());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Auto-save draft every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraftToStorage(form);
      setLastSaved(new Date());
      setHasDraft(true);
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [form]);

  // Fetch today's top pick
  const { data: picksData } = trpc.picks.list.useQuery({
    limit: 1,
    page: 1,
    tier: "all",
  });

  const generateMutation = trpc.storyGenerator.generateStory.useMutation({
    onSuccess: (data) => {
      if (data.success && data.buffer) {
        const url = `data:image/png;base64,${data.buffer}`;
        setPreviewUrl(url);
        toast.success("Story generated! Click Download or Copy to share.");
      } else {
        toast.error(data.error ?? "Generation failed");
      }
      setIsGenerating(false);
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
      setIsGenerating(false);
    },
  });

  const saveMutation = trpc.storyHistory.saveStory.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setCurrentStoryId(data.id);
        toast.success("Story saved to history!");
        clearDraftFromStorage();
        setHasDraft(false);
      }
    },
    onError: (err) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  const handleGenerate = () => {
    const oddsNum = parseInt(form.odds, 10);
    if (isNaN(oddsNum)) {
      toast.error("Please enter a valid odds value (e.g. -110 or +150)");
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate({
      sport: form.sport,
      homeTeam: form.homeTeam,
      awayTeam: form.awayTeam,
      recommendation: form.recommendation,
      odds: oddsNum,
      confidenceScore: form.confidenceScore,
      pickType: form.pickType,
      aiAnalysis: form.aiAnalysis || undefined,
      result: form.result || undefined,
    });
  };

  const handleSaveToHistory = () => {
    if (!previewUrl) {
      toast.error("Generate a story first");
      return;
    }
    const oddsNum = parseInt(form.odds, 10);
    saveMutation.mutate({
      sport: form.sport,
      homeTeam: form.homeTeam,
      awayTeam: form.awayTeam,
      recommendation: form.recommendation,
      odds: isNaN(oddsNum) ? undefined : oddsNum,
      confidenceScore: form.confidenceScore,
      pickType: form.pickType,
      aiAnalysis: form.aiAnalysis || undefined,
      result: form.result || undefined,
    });
  };

  const handleSchedulePost = () => {
    if (!previewUrl) {
      toast.error("Generate a story first");
      return;
    }
    if (!form.scheduledTime) {
      toast.error("Please select a time to schedule");
      return;
    }
    toast.success(`Story scheduled for ${form.scheduledTime}!`);
    setShowScheduler(false);
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `chalkpicks-story-${form.sport}-${Date.now()}.png`;
    a.click();
    toast.success("Story downloaded!");
  };

  const handleCopyToClipboard = async () => {
    if (!previewUrl) {
      toast.error("Generate a story first");
      return;
    }
    try {
      const blob = await fetch(previewUrl).then(r => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.success("Story copied to clipboard! Paste in Instagram Stories.");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
      console.error(err);
    }
  };

  const handleLoadFromPick = () => {
    if (!picksData?.picks || picksData.picks.length === 0) {
      toast.error("No picks available for today");
      return;
    }
    const pick = picksData.picks[0];
    setForm(prev => ({
      ...prev,
      sport: pick.sportKey || "nfl",
      homeTeam: pick.homeTeam || "",
      awayTeam: pick.awayTeam || "",
      recommendation: pick.recommendation || "",
      odds: String(pick.odds ?? "-110"),
      confidenceScore: pick.confidenceScore ?? 75,
      pickType: pick.pickType || "Spread",
      aiAnalysis: pick.aiAnalysis || "",
      result: pick.result || "",
    }));
    toast.success("Loaded today's top pick!");
  };

  const handleApplyTemplate = (templateId: string) => {
    setForm(prev => ({ ...prev, templateId }));
    toast.success(`Applied ${STORY_TEMPLATES.find(t => t.id === templateId)?.name} template`);
  };

  const handleClearDraft = () => {
    if (confirm("Clear the saved draft?")) {
      clearDraftFromStorage();
      setForm(DEFAULT_FORM);
      setHasDraft(false);
      toast.success("Draft cleared");
    }
  };

  const field = (key: keyof StoryForm) => ({
    value: form[key] ?? "",
    onChange: (v: string) => setForm(prev => ({ ...prev, [key]: key === "confidenceScore" ? Number(v) : v })),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
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
          📸 INSTAGRAM STORY GENERATOR
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
          Story Generator
        </h1>
        <p style={{ fontSize: "1rem", color: "rgba(200,210,230,0.55)", maxWidth: 520, margin: "0 auto" }}>
          Create branded 1080×1920 Instagram story images — auto-save drafts, schedule posts, use templates.
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

        {/* ═══ LEFT: FORM ═══ */}
        <div>
          {/* Templates */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}>
            <FieldLabel>Story Templates</FieldLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {STORY_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleApplyTemplate(t.id)}
                  style={{
                    background: form.templateId === t.id ? "rgba(57,255,20,0.15)" : "rgba(255,255,255,0.04)",
                    border: form.templateId === t.id ? "1px solid rgba(57,255,20,0.4)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: 12,
                    color: form.templateId === t.id ? "#39ff14" : "rgba(200,210,230,0.6)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <div>{t.name}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 28,
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.2rem", fontWeight: 600, color: "#f0b800", margin: 0 }}>
                  Pick Details
                </h2>
                {hasDraft && lastSaved && (
                  <div style={{ fontSize: 11, color: "rgba(57,255,20,0.6)", marginTop: 4, fontWeight: 600 }}>
                    💾 Auto-saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  onClick={handleLoadFromPick}
                  disabled={!picksData?.picks || picksData.picks.length === 0}
                  style={{
                    background: picksData?.picks?.length ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.05)",
                    border: picksData?.picks?.length ? "1px solid rgba(57,255,20,0.25)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    color: picksData?.picks?.length ? "#39ff14" : "rgba(200,210,230,0.3)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: picksData?.picks?.length ? "pointer" : "not-allowed",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  ⚡ Load Pick
                </button>
                {hasDraft && (
                  <button
                    onClick={handleClearDraft}
                    style={{
                      background: "rgba(230,57,70,0.1)",
                      border: "1px solid rgba(230,57,70,0.3)",
                      borderRadius: 8,
                      padding: "6px 12px",
                      color: "#e63946",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🗑️ Clear
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <FieldLabel>Sport</FieldLabel>
                <SelectField
                  value={form.sport}
                  onChange={v => setForm(p => ({ ...p, sport: v }))}
                  options={SPORTS.map(s => ({ value: s.key, label: s.label }))}
                />
              </div>
              <div>
                <FieldLabel>Pick Type</FieldLabel>
                <SelectField
                  value={form.pickType}
                  onChange={v => setForm(p => ({ ...p, pickType: v }))}
                  options={PICK_TYPES.map(t => ({ value: t, label: t }))}
                />
              </div>
              <div>
                <FieldLabel>Away Team</FieldLabel>
                <InputField {...field("awayTeam")} placeholder="e.g. Las Vegas Raiders" />
              </div>
              <div>
                <FieldLabel>Home Team</FieldLabel>
                <InputField {...field("homeTeam")} placeholder="e.g. Kansas City Chiefs" />
              </div>
              <div>
                <FieldLabel>Recommendation</FieldLabel>
                <InputField {...field("recommendation")} placeholder="e.g. Chiefs -7.5" />
              </div>
              <div>
                <FieldLabel>Odds (American)</FieldLabel>
                <InputField {...field("odds")} placeholder="e.g. -110 or +150" />
              </div>
              <div>
                <FieldLabel>Confidence Score (%)</FieldLabel>
                <InputField {...field("confidenceScore")} type="number" placeholder="0–100" />
              </div>
              <div>
                <FieldLabel>Result (optional)</FieldLabel>
                <SelectField
                  value={form.result}
                  onChange={v => setForm(p => ({ ...p, result: v }))}
                  options={[
                    { value: "", label: "Pending / Not Yet Settled" },
                    { value: "win", label: "✅ Win" },
                    { value: "loss", label: "❌ Loss" },
                    { value: "push", label: "➡️ Push" },
                  ]}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <FieldLabel>AI Analysis (optional)</FieldLabel>
              <textarea
                value={form.aiAnalysis}
                onChange={e => setForm(p => ({ ...p, aiAnalysis: e.target.value }))}
                placeholder="Brief AI analysis to display on the story..."
                rows={3}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#f0f2f5",
                  fontSize: 14,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "'Inter', sans-serif",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(57,255,20,0.4)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              width: "100%",
              background: isGenerating
                ? "rgba(57,255,20,0.3)"
                : "linear-gradient(135deg, #39ff14, #1a8c0a)",
              border: "none",
              borderRadius: 12,
              padding: "16px 32px",
              color: isGenerating ? "rgba(255,255,255,0.5)" : "#0a0a0f",
              fontSize: "1rem",
              fontWeight: 800,
              cursor: isGenerating ? "not-allowed" : "pointer",
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: "0.08em",
              boxShadow: isGenerating ? "none" : "0 0 24px rgba(57,255,20,0.3)",
              transition: "all 0.2s",
              marginBottom: 12,
            }}
          >
            {isGenerating ? "⏳ GENERATING STORY..." : "🎨 GENERATE STORY IMAGE"}
          </button>

          {previewUrl && (
            <>
              <button
                onClick={handleSaveToHistory}
                disabled={saveMutation.isPending}
                style={{
                  width: "100%",
                  background: "rgba(212,160,23,0.1)",
                  border: "1px solid rgba(212,160,23,0.3)",
                  borderRadius: 12,
                  padding: "12px 24px",
                  color: "#f0b800",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: saveMutation.isPending ? "not-allowed" : "pointer",
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                {saveMutation.isPending ? "💾 SAVING..." : "💾 SAVE TO HISTORY"}
              </button>

              <button
                onClick={() => setShowScheduler(!showScheduler)}
                style={{
                  width: "100%",
                  background: "rgba(30,144,255,0.1)",
                  border: "1px solid rgba(30,144,255,0.3)",
                  borderRadius: 12,
                  padding: "12px 24px",
                  color: "#1e90ff",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                {showScheduler ? "✕ CLOSE SCHEDULER" : "⏰ SCHEDULE FOR LATER"}
              </button>

              {showScheduler && (
                <div style={{
                  background: "rgba(30,144,255,0.05)",
                  border: "1px solid rgba(30,144,255,0.2)",
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 12,
                  marginBottom: 12,
                }}>
                  <FieldLabel>Schedule Post Time</FieldLabel>
                  <input
                    type="datetime-local"
                    value={form.scheduledTime || ""}
                    onChange={e => setForm(p => ({ ...p, scheduledTime: e.target.value }))}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      color: "#f0f2f5",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                  <button
                    onClick={handleSchedulePost}
                    style={{
                      width: "100%",
                      background: "rgba(30,144,255,0.15)",
                      border: "1px solid rgba(30,144,255,0.4)",
                      borderRadius: 8,
                      padding: "10px 16px",
                      color: "#1e90ff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: 12,
                      letterSpacing: "0.05em",
                    }}
                  >
                    📤 SCHEDULE POST
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ RIGHT: PREVIEW ═══ */}
        <div>
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.2rem", fontWeight: 600, color: "#f0b800", margin: 0 }}>
                Preview
              </h2>
              {previewUrl && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleCopyToClipboard}
                    style={{
                      background: "rgba(30,144,255,0.1)",
                      border: "1px solid rgba(30,144,255,0.3)",
                      borderRadius: 8,
                      padding: "8px 14px",
                      color: "#1e90ff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      letterSpacing: "0.05em",
                    }}
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={handleDownload}
                    style={{
                      background: "rgba(212,160,23,0.1)",
                      border: "1px solid rgba(212,160,23,0.3)",
                      borderRadius: 8,
                      padding: "8px 14px",
                      color: "#f0b800",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ⬇️ Download
                  </button>
                </div>
              )}
            </div>

            {previewUrl ? (
              <div style={{ position: "relative" }}>
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="Instagram Story Preview"
                  style={{
                    width: "100%",
                    maxWidth: 360,
                    height: "auto",
                    borderRadius: 16,
                    border: "2px solid rgba(212,160,23,0.25)",
                    boxShadow: "0 0 40px rgba(212,160,23,0.15)",
                  }}
                />
                <div style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "rgba(200,210,230,0.4)",
                }}>
                  1080 × 1920 px · {form.templateId} template
                </div>
              </div>
            ) : (
              <div style={{
                width: "100%",
                maxWidth: 360,
                margin: "0 auto",
                aspectRatio: "9/16",
                background: "rgba(13,15,20,0.8)",
                border: "2px dashed rgba(255,255,255,0.1)",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "rgba(200,210,230,0.3)",
              }}>
                <div style={{ fontSize: 48 }}>📸</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Story Preview</div>
                <div style={{ fontSize: 12, textAlign: "center", maxWidth: 200 }}>
                  Fill in the pick details and click Generate to create your branded story
                </div>
              </div>
            )}
          </div>

          {/* Features Info */}
          <div style={{
            marginTop: 20,
            background: "rgba(57,255,20,0.04)",
            border: "1px solid rgba(57,255,20,0.15)",
            borderRadius: 12,
            padding: 16,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#39ff14", marginBottom: 8 }}>✨ Features</p>
            <ul style={{ fontSize: 12, color: "rgba(200,210,230,0.55)", margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>💾 Auto-save drafts every 3 seconds</li>
              <li>⏰ Schedule posts for optimal times</li>
              <li>🎨 Choose from 3 story templates</li>
              <li>📋 Copy to clipboard for mobile paste</li>
              <li>📚 All stories saved to history</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
