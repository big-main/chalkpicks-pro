import { motion } from "framer-motion";

interface NotificationBadgeProps {
  count: number;
  show?: boolean;
}

export function NotificationBadge({ count, show = true }: NotificationBadgeProps) {
  if (!show || count === 0) return null;

  const pulseVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  };

  return (
    <motion.div
      variants={pulseVariants}
      animate="pulse"
      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
    >
      {count > 9 ? "9+" : count}
    </motion.div>
  );
}
