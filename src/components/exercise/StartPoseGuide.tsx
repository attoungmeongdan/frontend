import type { ReactNode } from "react";
import type { ExerciseType } from "@/constants/exercises";

interface StartPoseGuideProps {
  exerciseType: ExerciseType;
  isMatching: boolean;
}

const GUIDE_MESSAGE: Record<ExerciseType, string> = {
  "chair-stand": "의자 앞에 서서 기다려 주세요",
  "push-up": "엎드려 팔을 편 자세를 잡아 주세요",
  "sit-up": "무릎을 접고 바닥에 누워 주세요",
  plank: "팔꿈치를 접은 플랭크 자세를 잡아 주세요",
};

const POSE: Record<ExerciseType, ReactNode> = {
  "chair-stand": (
    <>
      <circle cx="200" cy="42" r="23" />
      <path d="M200 66v89m0-62-38 52m38-52 38 52m-38 10-43 78m43-78 43 78" />
      <path className="opacity-60" d="M128 129v69m0-42h46m-46 42-23 35m23-35 23 35" />
    </>
  ),
  "push-up": (
    <>
      <circle cx="329" cy="91" r="20" />
      <path d="m307 110-34 18-101 28-105 37m206-65 5 68m0-68 31 68M172 156l-25 40M67 193h258" />
    </>
  ),
  "sit-up": (
    <>
      <circle cx="74" cy="169" r="20" />
      <path d="m96 166 83 10 72-59 72 78m-227-29-25 29m108-19-37 20M48 196h299" />
    </>
  ),
  plank: (
    <>
      <circle cx="327" cy="92" r="20" />
      <path d="m304 112-30 16-102 27-108 38m210-65-16 65m16-65 35 64m-51 1h70M172 155l-26 39M47 195h302" />
    </>
  ),
};

function StartPoseGuide({ exerciseType, isMatching }: StartPoseGuideProps) {
  return (
    <div className="pointer-events-none absolute right-4 bottom-22 z-20 flex w-52 flex-col items-center landscape:right-6 landscape:bottom-1/2 landscape:w-58 landscape:translate-y-1/2">
      <p className="bg-camera-scrim text-caption mb-1 rounded-full px-3 py-1 font-semibold text-white">
        시작 자세 예시
      </p>
      <div className={isMatching ? "text-brand-mint" : "text-white/65"}>
        <svg
          viewBox="0 0 400 250"
          className="h-auto w-full drop-shadow-lg transition-colors duration-200"
          fill="none"
          stroke="currentColor"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {POSE[exerciseType]}
        </svg>
      </div>
      <p className="bg-camera-scrim text-body-small -mt-1 rounded-2xl px-4 py-2 text-center font-semibold break-keep text-white">
        {isMatching ? "좋아요! 판정을 시작할게요" : GUIDE_MESSAGE[exerciseType]}
      </p>
      {!isMatching && (
        <p className="text-caption mt-1 text-center text-white/80">
          화면 어느 위치든 전신과 자세가 보이면 자동으로 시작돼요
        </p>
      )}
    </div>
  );
}

export default StartPoseGuide;
