import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const GREETING: ChatMsg = {
  role: "assistant",
  content:
    "Hey! I'm ChalkPal 👋 Ask me anything about ChalkPicks — how the +EV finder works, what CLV means, pricing, or where to find a tool.",
};

const SUGGESTIONS = [
  "What is a +EV bet?",
  "How does the free trial work?",
  "Explain closing line value",
];

/**
 * ChalkPal — the floating mini AI chat helper, mounted globally in App.tsx.
 * Renders a launcher button only until opened, so it adds ~nothing to
 * interaction cost on page load. Conversation state lives in memory (per tab).
 */
export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const ask = trpc.assistant.ask.useMutation({
    onSuccess: data => {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    },
    onError: err => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content:
            err.data?.code === "TOO_MANY_REQUESTS"
              ? "Whoa, slow down a little — give me a minute and try again."
              : "Something went wrong on my end. Try again in a moment?",
        },
      ]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  const send = (text: string) => {
    const content = text.trim();
    if (!content || ask.isPending) return;
    const next: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    // Send visible history minus the canned greeting; server keeps last 8.
    ask.mutate({ messages: next.filter(m => m !== GREETING).slice(-8) });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open ChalkPal, the ChalkPicks AI assistant"
        className="fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center justify-center w-13 h-13 rounded-full shadow-lg transition-transform hover:scale-105"
        style={{
          width: 52,
          height: 52,
          background: "linear-gradient(135deg, #39ff14 0%, #f0b800 100%)",
          boxShadow: "0 0 18px rgba(57,255,20,0.45)",
        }}
      >
        <MessageCircle className="w-6 h-6 text-black" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col w-[92vw] max-w-sm rounded-2xl overflow-hidden border"
      style={{
        height: "min(560px, 75vh)",
        background: "rgba(10,10,18,0.97)",
        borderColor: "rgba(57,255,20,0.25)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 24px rgba(57,255,20,0.12)",
        backdropFilter: "blur(12px)",
      }}
      role="dialog"
      aria-label="ChalkPal AI assistant"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#39ff14" }} />
          <span className="font-semibold text-white text-sm">ChalkPal</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(57,255,20,0.12)", color: "#39ff14" }}>
            AI
          </span>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/50 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={
                m.role === "user"
                  ? { background: "rgba(57,255,20,0.14)", color: "#eaffea", borderBottomRightRadius: 6 }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(235,235,245,0.92)", borderBottomLeftRadius: 6 }
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {ask.isPending && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(235,235,245,0.6)" }}>
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "120ms" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "240ms" }}>·</span>
              </span>
            </div>
          </div>
        )}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-2.5 py-1.5 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(235,235,245,0.75)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={e => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 px-3 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about tools, EV, pricing…"
          maxLength={1000}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none px-3 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        />
        <button
          type="submit"
          disabled={!input.trim() || ask.isPending}
          aria-label="Send message"
          className="flex items-center justify-center w-9 h-9 rounded-xl transition-opacity disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #39ff14 0%, #f0b800 100%)" }}
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </form>

      <div className="px-3 pb-2 text-center text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
        Analytics & education — not betting advice. 21+ · 1-800-GAMBLER
      </div>
    </div>
  );
}
