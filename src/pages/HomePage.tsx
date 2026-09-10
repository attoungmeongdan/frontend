import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ExerciseCard from "@/components/home/ExerciseCard";
import MeasureBubble from "@/components/home/MeasureBubble";
import StreakCard, { type StreakDay } from "@/components/home/StreakCard";
import TrendChart, { type TrendSeries } from "@/components/home/TrendChart";
import Footer from "@/components/layout/Footer";
import MascotModal from "@/components/ui/MascotModal";
import { EXERCISES } from "@/constants/exercises";
import turtleResumeChoice from "@/assets/mascots/turtle-resume-choice.png";
import turtleTodayComplete from "@/assets/mascots/turtle-today-complete.png";

// 당일 측정 상태. 우선순위는 완료 > 재개 가능 > 새 측정
type MeasurementState = "new" | "resume" | "complete";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// TODO: 아래 3개는 모두 백엔드 응답으로 교체한다.
const MOCK_MEASUREMENT_STATE: MeasurementState = "resume";
const MOCK_STREAK = [true, false, true, false, false, true, false];
const MOCK_TREND: TrendSeries = {
  "sit-up": [
    { date: "3/12", value: 18 },
    { date: "4/02", value: 22 },
    { date: "5/21", value: 20 },
    { date: "7/15", value: 25 },
    { date: "9/09", value: 28 },
  ],
  "chair-stand": [
    { date: "4/02", value: 12 },
    { date: "5/21", value: 15 },
    { date: "7/15", value: 14 },
    { date: "9/09", value: 19 },
  ],
  "push-up": [
    { date: "5/21", value: 8 },
    { date: "7/15", value: 11 },
    { date: "9/09", value: 16 },
  ],
  plank: [
    { date: "7/15", value: 45 },
    { date: "9/09", value: 62 },
  ],
};

const BUBBLE_MESSAGE: Record<MeasurementState, string> = {
  new: "꾸북이와 같이 \n운동 능력 측정해볼까요?",
  resume: "멈춘 곳부터 이어서 해도\n괜찮아요. 같이 가볼까요?",
  complete: "오늘 측정은 끝났어요!\n내일 또 같이해요.",
};

function buildRecentDays(): StreakDay[] {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      label: WEEKDAY_LABELS[date.getDay()],
      done: MOCK_STREAK[index],
      isToday: index === 6,
    };
  });
}

// 홈 화면
function HomePage() {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState<"resume" | "complete" | null>(null);

  // TODO: 백엔드가 주는 당일 측정 상태로 교체한다.
  //       그전까지 ?state=resume / ?state=complete 로 모달을 확인 가능
  const [searchParams] = useSearchParams();
  const stateParam = searchParams.get("state");
  const measurementState: MeasurementState =
    stateParam === "resume" || stateParam === "complete" ? stateParam : MOCK_MEASUREMENT_STATE;

  const days = buildRecentDays();
  const hasTrend = Object.values(MOCK_TREND).some((points) => points.length >= 2);

  const handleMeasure = () => {
    if (measurementState === "resume" || measurementState === "complete") {
      setOpenModal(measurementState);
      return;
    }

    navigate("/measure");
  };

  return (
    <div className="flex flex-col gap-6">
      <StreakCard days={days} />

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

      <MeasureBubble message={BUBBLE_MESSAGE[measurementState]} onMeasure={handleMeasure} />

      {hasTrend && <TrendChart series={MOCK_TREND} />}

      <Footer />

      {openModal === "resume" && (
        <MascotModal
          mascot={turtleResumeChoice}
          title="측정을 다시 시작해 볼까요?"
          body={"멈춘 곳부터 이어서 할 수도 있고,\n처음부터 천천히 다시 할 수도 있어요."}
          primaryAction={{
            label: "이어서 측정하기",
            onClick: () => navigate("/measure?resume=true"),
          }}
          secondaryAction={{
            label: "처음부터 측정하기",
            onClick: () => navigate("/measure"),
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
