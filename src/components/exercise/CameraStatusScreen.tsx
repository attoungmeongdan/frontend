import { Camera, CameraOff, LoaderCircle, RefreshCw, TriangleAlert, VideoOff } from "lucide-react";
import Button from "@/components/ui/Button";
import type { ExerciseCameraState } from "@/types/exercise";

type StatusState = Exclude<ExerciseCameraState, "normal" | "no-body" | "bad-pose">;

interface CameraStatusScreenProps {
  state: StatusState;
  onPrimary: () => void;
  onHome: () => void;
}

const STATUS_CONTENT = {
  loading: {
    icon: LoaderCircle,
    title: "카메라를 준비하고 있어요",
    description: "카메라와 자세 인식 모델을 불러오는 동안 잠시만 기다려 주세요.",
    primaryLabel: "준비 중",
  },
  "permission-request": {
    icon: Camera,
    title: "카메라 사용이 필요해요",
    description: "동작을 세어 드리려면 카메라로 자세를 봐야 해요. 영상은 저장하지 않아요.",
    primaryLabel: "카메라 허용하고 진행",
  },
  "permission-denied": {
    icon: CameraOff,
    title: "카메라를 사용할 수 없어요",
    description: "브라우저 설정에서 카메라를 허용한 뒤 다시 시도해 주세요.",
    primaryLabel: "다시 시도하기",
  },
  "camera-unavailable": {
    icon: VideoOff,
    title: "연결된 카메라가 없어요",
    description: "카메라가 있는 기기에서 다시 열어 주세요.",
    primaryLabel: "다시 확인하기",
  },
  "camera-busy": {
    icon: TriangleAlert,
    title: "다른 앱이 카메라를 쓰고 있어요",
    description: "카메라를 사용하는 다른 앱을 닫고 다시 시도해 주세요.",
    primaryLabel: "다시 시도하기",
  },
  "model-error": {
    icon: TriangleAlert,
    title: "자세 인식을 준비하지 못했어요",
    description: "브라우저와 네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
    primaryLabel: "다시 시도하기",
  },
  disconnected: {
    icon: RefreshCw,
    title: "카메라 연결이 잠시 끊겼어요",
    description: "진행 기록은 안전해요. 연결되면 이어서 보여드릴게요.",
    primaryLabel: "다시 연결하기",
  },
} as const;

function CameraStatusScreen({ state, onPrimary, onHome }: CameraStatusScreenProps) {
  const { icon: Icon, title, description, primaryLabel } = STATUS_CONTENT[state];
  const isLoading = state === "loading";

  return (
    <section className="bg-surface-default flex h-full min-h-80 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
        <Icon
          size={64}
          className={`text-brand-teal-strong ${isLoading ? "motion-safe:animate-spin" : ""}`}
          aria-hidden
        />
        <div className="flex flex-col gap-3">
          <h1 className="text-heading-2 text-text-primary">{title}</h1>
          <p className="text-body text-text-secondary max-w-82">{description}</p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 px-5 pt-4 pb-[max(2.25rem,env(safe-area-inset-bottom))] landscape:mx-auto landscape:w-full landscape:max-w-100 landscape:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="button" onClick={onPrimary} disabled={isLoading}>
          {primaryLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onHome}>
          {state === "permission-request" ? "나중에 할게요 (홈으로)" : "홈으로 돌아가기"}
        </Button>
      </div>
    </section>
  );
}

export default CameraStatusScreen;
