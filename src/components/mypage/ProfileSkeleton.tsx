// 프로필·개인정보 로딩 자리. 시안에 별도 정의가 없어 추천 로딩과 같은 회색 블록을 쓴다
function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="flex items-center gap-3.5">
        <div className="bg-surface-subtle size-14 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="bg-surface-subtle h-5 w-24 rounded-md" />
          <div className="bg-surface-subtle h-4 w-36 rounded-md" />
        </div>
      </div>
      <div className="bg-surface-subtle h-44 w-full rounded-2xl" />
    </div>
  );
}

export default ProfileSkeleton;
