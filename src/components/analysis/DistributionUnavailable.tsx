// 비교 데이터 없음 — 분포·운동능력 나이 대신 표시한다. 평균을 0 으로 대체하지 않는다
function DistributionUnavailable() {
  return (
    <section className="bg-surface-subtle rounded-bubble flex flex-col items-center gap-1.5 p-5 text-center">
      <h2 className="text-body text-text-secondary font-bold">분포 비교 정보 없음</h2>
      <p className="text-body-small text-text-secondary leading-normal whitespace-pre-line">
        {"이 연령대의 비교 데이터가 아직 없어요. \n내 기록은 그대로 볼 수 있어요."}
      </p>
    </section>
  );
}

export default DistributionUnavailable;
