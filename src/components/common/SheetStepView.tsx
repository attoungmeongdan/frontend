import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

const SLIDE_TRANSITION = { duration: 0.28, ease: [0.32, 0.72, 0, 1] } as const;

const slideVariants = {
  enter: (direction: number) => ({ x: `${direction * 100}%`, opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (direction: number) => ({ x: `${-direction * 100}%`, opacity: 0 }),
};

interface SheetStepViewProps {
  step: string;
  direction?: 1 | -1;
  children: ReactNode;
}

function SheetStepView({ step, direction = 1, children }: SheetStepViewProps) {
  return (
    <div className="relative w-full overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SLIDE_TRANSITION}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default SheetStepView;
