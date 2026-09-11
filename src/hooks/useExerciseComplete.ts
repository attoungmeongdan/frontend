import { useQuery } from "@tanstack/react-query";
import { getWorkoutAnalysis } from "@/apis/exercise";

/** 자유 운동 완료 결과 조회. sessionId 가 없으면 요청하지 않는다 */
export function useWorkoutAnalysis(sessionId: string | null) {
  return useQuery({
    queryKey: ["workout-analysis", sessionId],
    queryFn: () => getWorkoutAnalysis(sessionId as string),
    enabled: sessionId !== null,
  });
}
