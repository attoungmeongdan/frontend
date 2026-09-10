import { useParams } from "react-router-dom";
import { EXERCISES, type ExerciseType } from "@/constants/exercises";

// 운동 수행 화면
// 종목은 URL 파라미터로 갈린다
function ExercisePage() {
  const { type } = useParams<{ type: ExerciseType }>();
  const exercise = EXERCISES.find((item) => item.type === type);

  return <h2 className="text-heading-2">{exercise?.label ?? "알 수 없는 운동"}</h2>;
}

export default ExercisePage;
