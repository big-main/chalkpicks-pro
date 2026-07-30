import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const subscribeToNewsletter = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("✓ Check your email for the daily picks digest!");
      setEmail("");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    },
    onError: error => {
      setStatus("error");
      setMessage(error.message || "Failed to subscribe. Please try again.");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    subscribeToNewsletter.mutate({ email });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-r from-[#39ff14]/10 to-[#d4af37]/10 border border-[#39ff14]/30 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-5 h-5 text-[#39ff14]" />
          <h3 className="text-lg font-bold text-white">Free Daily Picks</h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          Get AI-powered sports picks delivered to your inbox every morning. No
          spam, just winning picks.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={status === "loading" || status === "success"}
            className="bg-black/50 border-[#39ff14]/30 text-white placeholder-gray-500 focus:border-[#39ff14]"
          />
          <Button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full bg-[#39ff14] text-black font-bold hover:bg-[#39ff14]/90 disabled:opacity-50"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>

        {message && (
          <div
            className={`mt-3 flex items-center gap-2 text-sm ${
              status === "success" ? "text-[#39ff14]" : "text-red-400"
            }`}
          >
            {status === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
