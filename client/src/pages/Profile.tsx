import { useState, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663518369468/UFErFNbZfWFixyyI.png";

const TIER_COLORS: Record<string, string> = {
  free: "bg-white/10 text-white/50",
  trial: "bg-cyan-500/20 text-cyan-400",
  daily: "bg-blue-500/20 text-blue-400",
  monthly: "bg-violet-500/20 text-violet-400",
  yearly: "bg-amber-500/20 text-amber-400",
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  trial: "Trial",
  daily: "Daily Pass",
  monthly: "Monthly Pro",
  yearly: "Yearly Elite",
};

const SPORTS = ["NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB", "MMA", "Soccer"];

const THEMES = [
  { key: "dark", label: "Dark", bg: "bg-zinc-900", accent: "border-white/20" },
  { key: "neon", label: "Neon", bg: "bg-zinc-950", accent: "border-lime-400/60" },
  { key: "stealth", label: "Stealth", bg: "bg-slate-900", accent: "border-slate-500/60" },
  { key: "fire", label: "Fire", bg: "bg-zinc-950", accent: "border-red-500/60" },
];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/4 border border-white/8">
      <span className="text-xs text-white/40 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-white/30">{sub}</span>}
    </div>
  );
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading, refetch } = trpc.profile.getProfile.useQuery(undefined, {
    enabled: !!user,
  });
  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated!"); refetch(); setEditing(false); },
    onError: (e) => toast.error(e.message),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", bio: "", avatarUrl: "", favoriteSports: [] as string[], profileTheme: "dark" as string, isPublicProfile: false });

  function startEdit() {
    if (!profile) return;
    setForm({
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      avatarUrl: profile.avatarUrl ?? "",
      favoriteSports: profile.favoriteSports ?? [],
      profileTheme: profile.profileTheme ?? "dark",
      isPublicProfile: profile.isPublicProfile ?? false,
    });
    setEditing(true);
  }

  function toggleSport(sport: string) {
    setForm(f => ({
      ...f,
      favoriteSports: f.favoriteSports.includes(sport)
        ? f.favoriteSports.filter(s => s !== sport)
        : [...f.favoriteSports, sport],
    }));
  }

  function handleSave() {
    updateProfile.mutate({
      displayName: form.displayName || undefined,
      bio: form.bio || undefined,
      avatarUrl: form.avatarUrl || undefined,
      favoriteSports: form.favoriteSports,
      profileTheme: form.profileTheme as "dark" | "neon" | "stealth" | "fire",
      isPublicProfile: form.isPublicProfile,
    });
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-lime-400/40 border-t-lime-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-md py-32 text-center">
          <div className="text-5xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold mb-3">Sign in to view your profile</h1>
          <p className="text-white/50 mb-8">Create an account or sign in to access your personal profile, stats, and customizations.</p>
          <a href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-lime-400 text-black font-semibold hover:bg-lime-300 transition-colors">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const displayName = profile?.displayName || profile?.name || user.name || "Anonymous";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const tier = profile?.subscriptionTier ?? "free";
  const winRate = profile?.winRate ?? 0;
  const totalBets = profile?.totalBets ?? 0;
  const wins = profile?.wins ?? 0;
  const totalProfit = profile?.totalProfit ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-3xl py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-lime-400 transition-colors mb-8">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Home
        </Link>

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden border border-white/8 bg-white/3 p-8 mb-6"
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-lime-400/8 blur-3xl rounded-full" />
          </div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={displayName} className="w-20 h-20 rounded-full object-cover border-2 border-lime-400/40" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-lime-400/15 border-2 border-lime-400/40 flex items-center justify-center text-2xl font-bold text-lime-400">
                  {initials}
                </div>
              )}
              {tier !== "free" && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-white/10 flex items-center justify-center text-xs">
                  {tier === "yearly" ? "👑" : tier === "monthly" ? "⭐" : "🎫"}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold truncate">{displayName}</h1>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${TIER_COLORS[tier]}`}>
                  {TIER_LABELS[tier]}
                </span>
                {profile?.isPublicProfile && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/40">Public</span>
                )}
              </div>
              {profile?.bio && <p className="text-sm text-white/50 mb-2 leading-relaxed">{profile.bio}</p>}
              {profile?.favoriteSports && profile.favoriteSports.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.favoriteSports.map((s: string) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/20">{s}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-white/25 mt-2">
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
              </p>
            </div>

            {/* Edit button */}
            <Button variant="outline" size="sm" onClick={startEdit} className="flex-shrink-0 rounded-full border-white/15 hover:border-lime-400/40">
              Edit Profile
            </Button>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          <StatCard label="Total Bets" value={totalBets} />
          <StatCard label="Win Rate" value={`${winRate}%`} sub={`${wins}W / ${totalBets - wins}L`} />
          <StatCard label="Total Profit" value={`${totalProfit >= 0 ? "+" : ""}$${Math.abs(totalProfit).toFixed(0)}`} />
          <StatCard label="Tier" value={TIER_LABELS[tier]} sub={tier === "free" ? "Upgrade for more" : "Active"} />
        </motion.div>

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
        >
          {[
            { href: "/picks", icon: "🎯", label: "Today's Picks" },
            { href: "/bets", icon: "📊", label: "My Bets" },
            { href: "/pricing", icon: "⚡", label: "Upgrade Plan" },
            { href: "/notifications", icon: "🔔", label: "Notifications" },
            { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
            { href: "/account", icon: "⚙️", label: "Account Settings" },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white/3 border border-white/8 hover:border-lime-400/30 hover:bg-lime-400/5 transition-all group"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{label}</span>
            </Link>
          ))}
        </motion.div>

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wide mb-1.5 block">Display Name</label>
                  <Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="How you appear to others" className="rounded-xl bg-white/5 border-white/10" maxLength={128} />
                </div>

                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wide mb-1.5 block">Bio</label>
                  <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell us about your betting style..." className="rounded-xl bg-white/5 border-white/10 resize-none" rows={3} maxLength={500} />
                  <p className="text-xs text-white/25 mt-1">{form.bio.length}/500</p>
                </div>

                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wide mb-1.5 block">Avatar URL</label>
                  <Input value={form.avatarUrl} onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                    placeholder="https://..." className="rounded-xl bg-white/5 border-white/10" />
                </div>

                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">Favorite Sports</label>
                  <div className="flex flex-wrap gap-2">
                    {SPORTS.map(sport => (
                      <button key={sport} onClick={() => toggleSport(sport)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          form.favoriteSports.includes(sport)
                            ? "bg-lime-400/15 border-lime-400/50 text-lime-400"
                            : "bg-white/5 border-white/10 text-white/50 hover:border-white/25"
                        }`}
                      >
                        {sport}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">Profile Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMES.map(t => (
                      <button key={t.key} onClick={() => setForm(f => ({ ...f, profileTheme: t.key }))}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${t.bg} ${
                          form.profileTheme === t.key ? t.accent : "border-transparent opacity-60 hover:opacity-80"
                        }`}
                      >
                        <p className="text-xs font-medium text-white">{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8">
                  <div>
                    <p className="text-sm font-medium">Public Profile</p>
                    <p className="text-xs text-white/40">Allow others to view your stats</p>
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, isPublicProfile: !f.isPublicProfile }))}
                    className={`w-11 h-6 rounded-full transition-all relative ${form.isPublicProfile ? "bg-lime-400" : "bg-white/15"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.isPublicProfile ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setEditing(false)} className="flex-1 rounded-full border-white/15">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateProfile.isPending} className="flex-1 rounded-full bg-lime-400 text-black hover:bg-lime-300">
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
