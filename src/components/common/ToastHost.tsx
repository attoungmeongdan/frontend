import { AnimatePresence, motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import Toast from "@/components/ui/Toast";

interface ToastHostProps {
  message: string | null;
  size?: "default" | "compact";
  icon?: LucideIcon;
  iconClassName?: string;
}

function ToastHost({ message, size = "compact", icon, iconClassName }: ToastHostProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(92px+max(10px,env(safe-area-inset-bottom)))] z-70 flex justify-center px-5"
        >
          <Toast message={message} size={size} icon={icon} iconClassName={iconClassName} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ToastHost;
