import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { withMinimumDuration } from "@/utils/minimumDuration";
import ExerciseCard from "@/components/home/ExerciseCard";
import MeasureBubble from "@/components/home/MeasureBubble";
import StreakCard from "@/components/home/StreakCard";
import TrendChart from "@/components/home/TrendChart";
import Footer from "@/components/layout/Footer";
import MascotModal from "@/components/ui/MascotModal";
import { EXERCISES } from "@/constants/exercises";
import {
  useMeasurementState,
  useMeasurementTrend,
  useWeeklyStreak,
  type MeasurementState,
} from "@/hooks/useHomeData";
import turtleResumeChoice from "@/assets/mascots/turtle-resume-choice.png";
import turtleTodayComplete from "@/assets/mascots/turtle-today-complete.png";

const BUBBLE_MESSAGE: Record<MeasurementState, string> = {
  new: "꾸북이와 같이 \n운동 능력 측정해볼까요?",
  resume: "멈춘 곳부터 이어서 해도\n괜찮아요. 같이 가볼까요?",
  complete: "오늘 측정은 끝났어요!\n내일 또 같이해요.",
};

// 홈 화면
function HomePage() {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState<"resume" | "complete" | null>(null);

  const { streak } = useWeeklyStreak();
  const {
    measurementState,
    progress,
    isLoading: isStateLoading,
    isError,
    refetch,
  } = useMeasurementState();
  const busyRef = useRef(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const { trend } = useMeasurementTrend();

  const hasTrend = Object.values(trend).some((points) => points.length >= 2);

  const handleMeasure = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsChecking(true);
    setCheckError(false);
    try {
      const result = await withMinimumDuration(() => refetch());
      if (result.isError || !result.data) throw new Error("progress unavailable");
      if (result.data.completed) setOpenModal("complete");
      else if (result.data.completedExercises.length > 0) setOpenModal("resume");
      else {
        navigate("/measure");
        return;
      }
    } catch {
      setCheckError(true);
    }
    busyRef.current = false;
    setIsChecking(false);
  };
  const enterMeasurement = (restart: boolean) => {
    if (busyRef.current) return;
    busyRef.current = true;
    navigate("/measure", {
      state: restart ? { restartGroupId: progress?.measurementGroupId } : null,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <StreakCard days={streak} />

      <section className="flex flex-col gap-3">
        <h2 className="text-title text-text-primary font-bold">자유 운동</h2>

        <div className="flex gap-3">
          {EXERCISES.slice(0, 2).map((exercise) => (
            <ExerciseCard
              key={exercise.type}
              label={exercise.cardLabel}
              icon={exercise.icon}
              onClick={() => navigate(`/exercise/${exercise.type}`)}
            />
          ))}
        </div>
        <div className="flex gap-3">
          {EXERCISES.slice(2).map((exercise) => (
            <ExerciseCard
              key={exercise.type}
              label={exercise.cardLabel}
              icon={exercise.icon}
              onClick={() => navigate(`/exercise/${exercise.type}`)}
            />
          ))}
        </div>
      </section>

      <MeasureBubble
        message={isChecking ? "측정 상태를 확인하고 있어요…" : BUBBLE_MESSAGE[measurementState]}
        onMeasure={handleMeasure}
        disabled={isStateLoading || isChecking}
      />

      {(isError || checkError) && (
        <p role="alert" className="text-body-small text-center">
          측정 상태를 확인하지 못했어요. 측정하기를 눌러 다시 확인해 주세요.
        </p>
      )}
      {hasTrend && <TrendChart series={trend} />}

      <Footer />

      {openModal === "resume" && (
        <MascotModal
          mascot={turtleResumeChoice}
          title="측정을 다시 시작해 볼까요?"
          body={"멈춘 곳부터 이어서 할 수도 있고,\n처음부터 천천히 다시 할 수도 있어요."}
          primaryAction={{
            label: "이어서 측정하기",
            onClick: () => enterMeasurement(false),
          }}
          secondaryAction={{
            label: "처음부터 측정하기",
            onClick: () => enterMeasurement(true),
          }}
          onClose={() => setOpenModal(null)}
        />
      )}

      {openModal === "complete" && (
        <MascotModal
          mascot={turtleTodayComplete}
          title="오늘 측정은 끝났어요!"
          body="내일 다시 한 번 측정해 보세요~"
          primaryAction={{ label: "알겠어요", onClick: () => setOpenModal(null) }}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
}

export default HomePage;
