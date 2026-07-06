import { motion } from "framer-motion";
import { MessageCircle, Send, Users, Heart, Reply2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: number;
  isLiked: boolean;
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  members: number;
  icon: string;
}

const channels: ChatChannel[] = [
  {
    id: "general",
    name: "General",
    description: "General discussion and announcements",
    members: 3420,
    icon: "💬",
  },
  {
    id: "picks",
    name: "Picks Discussion",
    description: "Discuss today's picks and analysis",
    members: 2150,
    icon: "🎯",
  },
  {
    id: "wins",
    name: "Wins & Celebrations",
    description: "Share your wins and celebrate streaks",
    members: 1890,
    icon: "🎉",
  },
  {
    id: "strategy",
    name: "Strategy & Tips",
    description: "Share betting strategies and tips",
    members: 1240,
    icon: "📊",
  },
];

const mockMessages: ChatMessage[] = [
  {
    id: "1",
    author: "ProBettor",
    avatar: "👤",
    content: "Just hit a 5-leg parlay! +340 odds 🔥 Thanks ChalkPicks!",
    timestamp: new Date(Date.now() - 5 * 60000),
    likes: 127,
    replies: 23,
    isLiked: false,
  },
  {
    id: "2",
    author: "PickMaster",
    avatar: "👤",
    content: "Anyone else using the +EV Finder? Game changer for line shopping",
    timestamp: new Date(Date.now() - 12 * 60000),
    likes: 89,
    replies: 34,
    isLiked: false,
  },
  {
    id: "3",
    author: "OddsWizard",
    avatar: "👤",
    content: "Steam move detected on the NBA game. Line moved from -5.5 to -7. Following the sharp money 📈",
    timestamp: new Date(Date.now() - 25 * 60000),
    likes: 156,
    replies: 45,
    isLiked: false,
  },
];

export default function CommunityChat() {
  const [selectedChannel, setSelectedChannel] = useState("general");
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      author: "You",
      avatar: "👤",
      content: newMessage,
      timestamp: new Date(),
      likes: 0,
      replies: 0,
      isLiked: false,
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const toggleLike = (messageId: string) => {
    const newLiked = new Set(likedMessages);
    if (newLiked.has(messageId)) {
      newLiked.delete(messageId);
    } else {
      newLiked.add(messageId);
    }
    setLikedMessages(newLiked);

    setMessages(
      messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, likes: msg.likes + (newLiked.has(messageId) ? 1 : -1) }
          : msg
      )
    );
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageCircle className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Community Chat
            </h1>
          </div>
          <p className="text-muted-foreground">Connect with other bettors and share strategies</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Channels Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="glass-card border-green-400/20 p-4">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Channels
              </h2>
              <div className="space-y-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedChannel === channel.id
                        ? "bg-green-400/20 border border-green-400/40"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{channel.icon}</span>
                      <p className="font-semibold text-sm text-foreground">{channel.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{channel.members} members</p>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Chat Area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card className="glass-card border-green-400/20 h-[600px] flex flex-col">
              {/* Channel Header */}
              <div className="p-4 border-b border-green-400/20">
                <h2 className="font-bold text-foreground">
                  {channels.find((c) => c.id === selectedChannel)?.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {channels.find((c) => c.id === selectedChannel)?.description}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{msg.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-foreground">{msg.author}</p>
                          <p className="text-xs text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <p className="text-sm text-foreground mb-2">{msg.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <button
                            onClick={() => toggleLike(msg.id)}
                            className="flex items-center gap-1 hover:text-red-400 transition-colors"
                          >
                            <Heart
                              className={`w-3 h-3 ${
                                likedMessages.has(msg.id) ? "fill-red-400 text-red-400" : ""
                              }`}
                            />
                            {msg.likes}
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                            <Reply2 className="w-3 h-3" />
                            {msg.replies}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-green-400/20">
                <div className="flex gap-2">
                  <Input
                    placeholder="Share your thoughts..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-white/5 border-green-400/20"
                  />
                  <Button onClick={handleSendMessage} className="btn-premium">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
