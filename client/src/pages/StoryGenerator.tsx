import { useState, useRef } from "react";
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
};

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
  const [form, setForm] = useState<StoryForm>(DEFAULT_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const generateMutation = trpc.storyGenerator.generateStory.useMutation({
    onSuccess: (data) => {
      if (data.success && data.buffer) {
        const url = `data:image/png;base64,${data.buffer}`;
        setPreviewUrl(url);
        toast.success("Story generated! Click Download to save.");
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

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `chalkpicks-story-${form.sport}-${Date.now()}.png`;
    a.click();
    toast.success("Story downloaded!");
  };

  const handleLoadFromPick = () => {
    // Pre-fill with today's top pick (mock for now, can be wired to trpc.picks.list)
    setForm({
      sport: "nba",
      homeTeam: "Boston Celtics",
      awayTeam: "Golden State Warriors",
      recommendation: "Over 224.5",
      odds: "-115",
      confidenceScore: 79,
      pickType: "Over/Under",
      aiAnalysis: "Both teams rank top-5 in offensive efficiency. The Celtics-Warriors matchup historically goes over 68% of the time. Warriors pace of play combined with Celtics 3-point volume creates high-scoring environments.",
      result: "",
    });
    toast.info("Loaded today's top pick");
  };

  const field = (key: keyof StoryForm) => ({
    value: form[key],
    onChange: (v: string) => setForm(prev => ({ ...prev, [key]: key === "confidenceScore" ? Number(v) : v })),
  });

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
          Create branded 1080×1920 Instagram story images for @chalkpicks — dark theme, gold crown, neon green accents.
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

        {/* ═══ LEFT: FORM ═══ */}
        <div>
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 28,
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.2rem", fontWeight: 600, color: "#f0b800", margin: 0 }}>
                Pick Details
              </h2>
              <button
                onClick={handleLoadFromPick}
                style={{
                  background: "rgba(57,255,20,0.08)",
                  border: "1px solid rgba(57,255,20,0.25)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  color: "#39ff14",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                ⚡ Load Today's Pick
              </button>
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
                rows={4}
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

          {/* Generate Button */}
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
            }}
          >
            {isGenerating ? "⏳ GENERATING STORY..." : "🎨 GENERATE STORY IMAGE"}
          </button>

          {/* Brand Info */}
          <div style={{
            marginTop: 20,
            background: "rgba(212,160,23,0.05)",
            border: "1px solid rgba(212,160,23,0.15)",
            borderRadius: 12,
            padding: 16,
          }}>
            <p style={{ fontSize: 12, color: "rgba(200,210,230,0.5)", margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "#f0b800" }}>Brand spec:</strong> Dark #0d0f14 bg · Gold crown logo · Neon green picks · 1080×1920 PNG · @chalkpicks handle · chalkpicks.live CTA
            </p>
          </div>
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
                <button
                  onClick={handleDownload}
                  style={{
                    background: "rgba(212,160,23,0.1)",
                    border: "1px solid rgba(212,160,23,0.3)",
                    borderRadius: 8,
                    padding: "8px 18px",
                    color: "#f0b800",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  ⬇️ Download PNG
                </button>
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
                  1080 × 1920 px · Instagram Story format
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

          {/* Usage Tips */}
          <div style={{
            marginTop: 20,
            background: "rgba(30,144,255,0.04)",
            border: "1px solid rgba(30,144,255,0.15)",
            borderRadius: 12,
            padding: 16,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1e90ff", marginBottom: 8 }}>📋 Posting Tips</p>
            <ul style={{ fontSize: 12, color: "rgba(200,210,230,0.55)", margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>Download the PNG and upload directly to Instagram Stories</li>
              <li>Add interactive stickers (poll, question) after uploading</li>
              <li>Post between 6–9 AM or 6–9 PM for peak engagement</li>
              <li>Tag relevant teams/players in the story for discovery</li>
              <li>Add a "Swipe Up" or link sticker pointing to chalkpicks.live</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
