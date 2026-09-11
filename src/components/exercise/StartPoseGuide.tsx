import chairStandGuide from "@/assets/exercises/guide-chair-stand.webp";
import plankGuide from "@/assets/exercises/guide-plank.webp";
import pushUpGuide from "@/assets/exercises/guide-push-up.webp";
import sitUpGuide from "@/assets/exercises/guide-sit-up.webp";
import type { ExerciseType } from "@/constants/exercises";

interface StartPoseGuideProps {
  exerciseType: ExerciseType;
  isMatching: boolean;
}

const GUIDE: Record<ExerciseType, { image: string; message: string }> = {
  "chair-stand": {
    image: chairStandGuide,
    message: "의자 앞에 서서 기다려 주세요",
  },
  "push-up": {
    image: pushUpGuide,
    message: "엎드려 팔을 편 자세를 잡아 주세요",
  },
  "sit-up": {
    image: sitUpGuide,
    message: "무릎을 접고 바닥에 누워 주세요",
  },
  plank: {
    image: plankGuide,
    message: "팔꿈치를 접은 플랭크 자세를 잡아 주세요",
  },
};

function StartPoseGuide({ exerciseType, isMatching }: StartPoseGuideProps) {
  const guide = GUIDE[exerciseType];

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 pt-16 pb-28 landscape:pt-12 landscape:pb-20">
      <img
        src={guide.image}
        alt=""
        aria-hidden
        className={`max-h-[68dvh] w-[min(88vw,44rem)] object-contain opacity-60 drop-shadow-lg transition-[filter] duration-200 landscape:max-h-[76dvh] landscape:w-[min(72vw,52rem)] ${
          isMatching ? "brightness-125 saturate-150" : ""
        }`}
      />
      <div className="absolute inset-x-4 bottom-[max(2.25rem,env(safe-area-inset-bottom))] flex flex-col items-center landscape:bottom-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="bg-camera-scrim text-body-small rounded-2xl px-4 py-2 text-center font-semibold break-keep text-white">
          {isMatching ? "좋아요! 운동 측정을 시작할게요" : guide.message}
        </p>
        {!isMatching && (
          <p className="bg-camera-scrim text-caption mt-1 rounded-full px-3 py-1 text-center font-medium break-keep text-white/90">
            자세를 취하고 운동하면 자동으로 측정이 시작돼요
          </p>
        )}
      </div>
    </div>
  );
}

export default StartPoseGuide;
