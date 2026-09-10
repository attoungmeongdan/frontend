import { useMemo } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import CameraStage, { type CameraWarning } from "@/components/exercise/CameraStage";
import CameraStatusScreen from "@/components/exercise/CameraStatusScreen";
import { EXERCISES, type ExerciseType } from "@/constants/exercises";
import { DEFAULT_EXERCISE_SESSION_MOCK, isExerciseCameraState } from "@/mocks/exercise";

function formatElapsedTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

// 운동 수행 화면
// 종목은 URL 파라미터로 갈린다
function ExercisePage() {
  const { type } = useParams<{ type: ExerciseType }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const exercise = EXERCISES.find((item) => item.type === type);
  const requestedState = searchParams.get("state");
  const session = useMemo(
    () => ({
      ...DEFAULT_EXERCISE_SESSION_MOCK,
      state: isExerciseCameraState(requestedState)
        ? requestedState
        : DEFAULT_EXERCISE_SESSION_MOCK.state,
    }),
    [requestedState],
  );

  if (!exercise || !type) {
    return <Navigate to="/not-found" replace />;
  }

  const moveToNormalMock = () => setSearchParams({ state: "normal" });
  const moveHome = () => navigate("/");

  if (session.state !== "normal" && session.state !== "no-body" && session.state !== "bad-pose") {
    return (
      <CameraStatusScreen state={session.state} onPrimary={moveToNormalMock} onHome={moveHome} />
    );
  }

  const displayValue =
    session.state === "no-body"
      ? "—"
      : type === "plank"
        ? formatElapsedTime(session.elapsedSeconds)
        : String(session.count);
  const warning: CameraWarning | undefined = session.state === "normal" ? undefined : session.state;

  return (
    <CameraStage
      exerciseName={exercise.label}
      value={displayValue}
      valueKind={type === "plank" ? "timer" : "count"}
      warning={warning}
      onCancel={moveHome}
      onEnd={() => navigate(`/exercise/${type}/complete`)}
    />
  );
}

export default ExercisePage;
