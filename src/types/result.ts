/**
 * 동연령대 평균 대비 비교 상태.
 * 서버(또는 목데이터)가 정해 준 값을 그대로 쓰고, 프론트에서 수치로 계산하지 않는다.
 */
export type ResultComparison = "low" | "similar" | "high";

/** 결과 값 종류. 횟수 종목은 회, 플랭크는 시간(초) */
export type ResultValueKind = "count" | "time";
