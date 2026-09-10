import { useQuery } from "@tanstack/react-query";
import { getRecentSevenDays, type RecentExerciseStatus } from "@/apis/calendar";
import { getMeasurementHistory, getMeasurementProgress } from "@/apis/exercise";
import type { StreakDay } from "@/components/home/StreakCard";
import type { TrendPoint, TrendSeries } from "@/components/home/TrendChart";
import { EXERCISES } from "@/constants/exercises";
import type { MeasurementHistory, MeasurementProgress, MeasurementRecord } from "@/types/exercise";
import { getRecentSeoulDays } from "@/utils/date";

/** 당일 측정 상태. 우선순위는 완료 > 재개 가능 > 새 측정 (화면정의서 기준) */
export type MeasurementState = "new" | "resume" | "complete";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const STREAK_DAYS = 7;

function buildPlaceholderStreak(): StreakDay[] {
  return getRecentSeoulDays(STREAK_DAYS).map((day, index, days) => ({
    label: WEEKDAY_LABELS[day.weekday],
    done: false,
    isToday: index === days.length - 1,
  }));
}

function toStreak(days: RecentExerciseStatus[]): StreakDay[] {
  return days.map((day, index) => ({
    label: day.dayOfWeek,
    done: day.isCompleted,
    isToday: index === days.length - 1,
  }));
}

export function useWeeklyStreak() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-seven-days"],
    queryFn: getRecentSevenDays,
    staleTime: 60_000,
  });

  return {
    streak: data ? toStreak(data) : buildPlaceholderStreak(),
    isLoading,
  };
}

function toMeasurementState(progress?: MeasurementProgress): MeasurementState {
  if (!progress) {
    return "new";
  }
  if (progress.completed) {
    return "complete";
  }

  return progress.completedExercises.length > 0 ? "resume" : "new";
}

export function useMeasurementState() {
  const { data, isLoading } = useQuery({
    queryKey: ["measurement-progress"],
    queryFn: getMeasurementProgress,
    staleTime: 60_000,
  });

  return { measurementState: toMeasurementState(data), isLoading };
}

function formatPointDate(measuredAt: string) {
  const measured = new Date(measuredAt);

  return `${measured.getMonth() + 1}/${String(measured.getDate()).padStart(2, "0")}`;
}

function toTrendSeries(history?: MeasurementHistory): TrendSeries {
  const records: MeasurementRecord[] = [
    ...(history?.previousMeasurements ?? []),
    ...(history?.today ? [history.today] : []),
  ].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));

  const series = {} as TrendSeries;

  for (const exercise of EXERCISES) {
    const points: TrendPoint[] = [];

    for (const record of records) {
      const measured = record.exercises[exercise.apiType];

      if (measured) {
        points.push({ date: formatPointDate(record.measuredAt), value: measured.value });
      }
    }

    series[exercise.type] = points;
  }

  return series;
}

export function useMeasurementTrend() {
  const { data, isLoading } = useQuery({
    queryKey: ["measurement-history"],
    queryFn: getMeasurementHistory,
    staleTime: 60_000,
  });

  return { trend: toTrendSeries(data), isLoading };
}
