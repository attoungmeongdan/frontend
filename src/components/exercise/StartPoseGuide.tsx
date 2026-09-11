import chairStandGuide from "@/assets/exercises/guide-chair-stand.png";
import plankGuide from "@/assets/exercises/guide-plank.png";
import pushUpGuide from "@/assets/exercises/guide-push-up.png";
import sitUpGuide from "@/assets/exercises/guide-sit-up.png";
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
    <div className="camera-stage-view pointer-events-none relative z-20 flex flex-col items-center gap-2">
      <img
        src={guide.image}
        alt=""
        aria-hidden
        className={`min-h-0 w-full flex-1 object-contain opacity-60 drop-shadow-lg transition-[filter] duration-200 ${
          isMatching ? "brightness-125 saturate-150" : ""
        }`}
      />
      <div className="flex w-full shrink-0 flex-col items-center">
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
