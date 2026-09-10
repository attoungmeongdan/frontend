import { useEffect, useState } from "react";
import { ClipboardX, LoaderCircle, TriangleAlert } from "lucide-react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import turtleCheer from "@/assets/mascots/turtle-cheer.png";
import ExerciseResultCard from "@/components/result/ExerciseResultCard";
import Button from "@/components/ui/Button";
import MascotSpeech from "@/components/ui/MascotSpeech";
import {
  MEASUREMENT_RESULT_EXERCISES,
  RESULT_VALUE_UNIT,
  type MeasurementResultExercise,
} from "@/constants/result";
import {
  EXERCISE_COMPLETE_RETRY_DELAY_MS,
  getExerciseCompleteMock,
  readExerciseCompleteMockState,
  type ExerciseCompleteMockState,
} from "@/mocks/exerciseComplete";
import { formatDurationClock } from "@/utils/result";

const CALENDAR_GUIDE_MESSAGE = "오늘도 몸을 움직여 주셨네요.\n캘린더에 기록을 보러 갈까요?";

function ExerciseCompletePage() {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const exercise = MEASUREMENT_RESULT_EXERCISES.find((item) => item.type === type);
  const mockState = readExerciseCompleteMockState(searchParams.get("state"));

  if (!exercise) return <Navigate to="/not-found" replace />;

  // 종목·목 상태 변경 시 진행 중인 재시도를 초기화한다 (#11과 동일한 흐름).
  return (
    <ExerciseComplete key={`${type}:${mockState}`} exercise={exercise} mockState={mockState} />
  );
}

function ExerciseComplete({
  exercise,
  mockState,
}: {
  exercise: MeasurementResultExercise;
  mockState: ExerciseCompleteMockState;
}) {
  const navigate = useNavigate();
  const [retryPhase, setRetryPhase] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    if (retryPhase !== "loading") return;
    const timer = window.setTimeout(() => setRetryPhase("done"), EXERCISE_COMPLETE_RETRY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [retryPhase]);

  if (mockState === "loading" || retryPhase === "loading") {
    return (
      <div className="flex flex-col gap-6 pt-2.5 pb-3">
        <div
          aria-hidden
          className="bg-surface-subtle rounded-card h-56 motion-safe:animate-pulse"
        />
        <p
          role="status"
          className="text-body text-brand-teal-strong flex items-center justify-center gap-2"
        >
          <LoaderCircle size={20} aria-hidden className="shrink-0 motion-safe:animate-spin" />
          운동 결과를 불러오고 있어요…
        </p>
      </div>
    );
  }

  const isError = mockState === "error" && retryPhase === "idle";
  const result = getExerciseCompleteMock(
    exercise.type,
    retryPhase === "done" ? "default" : mockState,
  );

  if (isError || !result) {
    const Icon = isError ? TriangleAlert : ClipboardX;
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-3 py-6 text-center">
        <div role={isError ? "alert" : "status"} className="flex flex-col items-center gap-4">
          <Icon size={56} aria-hidden className="text-brand-teal-strong shrink-0" />
          <h2 className="text-title font-bold">
            {isError ? "운동 결과를 불러오지 못했어요" : "운동 결과가 없어요"}
          </h2>
          <p className="text-body text-text-secondary break-keep">
            {isError ? "잠시 후 다시 시도해 주세요." : "홈에서 자유 운동을 시작해 보세요."}
          </p>
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={isError ? () => setRetryPhase("loading") : () => navigate("/")}
        >
          {isError ? "다시 불러오기" : "홈으로 돌아가기"}
        </Button>
      </div>
    );
  }

  const formatValue = (value: number) =>
    exercise.valueKind === "time" ? formatDurationClock(value) : String(value);
  const averageLabel =
    result.average === null
      ? undefined
      : `동연령대 평균 ${formatValue(result.average)}${exercise.valueKind === "count" ? "회" : ""}`;

  return (
    <div className="flex flex-col gap-6 pt-2.5 pb-3 break-keep">
      <ExerciseResultCard
        variant="complete"
        name={exercise.name}
        value={formatValue(result.value)}
        unit={RESULT_VALUE_UNIT[exercise.valueKind]}
        averageLabel={averageLabel}
        comparison={result.comparison ?? undefined}
      />
      <MascotSpeech
        mascot={turtleCheer}
        message={CALENDAR_GUIDE_MESSAGE}
        action={
          <Button type="button" onClick={() => navigate("/calendar")}>
            캘린더 보기
          </Button>
        }
      />
    </div>
  );
}

export default ExerciseCompletePage;
