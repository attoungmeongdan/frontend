import type { RefObject } from "react";

interface PoseCameraFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

function PoseCameraFeed({ videoRef, canvasRef }: PoseCameraFeedProps) {
  // Use the same intrinsic frame, fit and mirror for both layers. Contain keeps
  // detected joints visible when the source and viewport aspect ratios differ.
  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-hidden>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full scale-x-[-1] object-contain"
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1] object-contain"
      />
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}

export default PoseCameraFeed;
