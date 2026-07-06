import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";

interface OnboardingVideoProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
}

export function OnboardingVideo({ isOpen, onClose, videoUrl }: OnboardingVideoProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Default HeyGen video URL (replace with your actual video)
  const defaultVideoUrl = videoUrl || "https://player.vimeo.com/video/placeholder";

  const handleFullscreen = () => {
    const videoElement = document.getElementById("onboarding-video") as HTMLVideoElement;
    if (videoElement) {
      if (!document.fullscreenElement) {
        videoElement.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl bg-background rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-green-400/20">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Welcome to ChalkPicks Pro</h2>
                <p className="text-sm text-muted-foreground mt-1">Learn how to get started in 2 minutes</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
              {/* Placeholder video or iframe */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400/10 to-blue-400/10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-center"
                >
                  <Play className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-foreground font-semibold">HeyGen Video Player</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your onboarding video will play here
                  </p>
                </motion.div>

                {/* Actual video would go here */}
                {/* <iframe
                  id="onboarding-video"
                  src={defaultVideoUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                /> */}
              </div>

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <span className="text-xs text-white">{isMuted ? "Muted" : "Sound On"}</span>
                </div>

                <button
                  onClick={handleFullscreen}
                  className="px-4 py-2 bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded-lg text-sm font-medium transition-colors"
                >
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </button>
              </div>
            </div>

            {/* Content Sections */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-background/50 rounded-lg border border-green-400/20">
                  <h3 className="font-semibold text-foreground mb-2">📊 View Picks</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse AI-generated sports picks with confidence scores and +EV analysis
                  </p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-green-400/20">
                  <h3 className="font-semibold text-foreground mb-2">🎯 Place Bets</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your bets across DraftKings, FanDuel, and other sportsbooks
                  </p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-green-400/20">
                  <h3 className="font-semibold text-foreground mb-2">📈 Track Wins</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor your performance, ROI, and win streaks in real-time
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 p-6 border-t border-green-400/20">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Skip for Now
              </Button>
              <Button onClick={onClose} className="btn-premium flex-1">
                Get Started →
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
