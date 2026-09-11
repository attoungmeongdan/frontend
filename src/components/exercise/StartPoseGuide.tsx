import { getExerciseContent } from "@/constants/exerciseContent";
import type { ExerciseType } from "@/constants/exercises";

interface StartPoseGuideProps {
  exerciseType: ExerciseType;
  isMatching: boolean;
  mode?: "WORKOUT" | "MEASUREMENT";
}

function StartPoseGuide({ exerciseType, isMatching, mode = "WORKOUT" }: StartPoseGuideProps) {
  const guide = getExerciseContent(exerciseType, mode);

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
          {isMatching ? "좋아요! 운동 측정을 시작할게요" : guide.startMessage}
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
