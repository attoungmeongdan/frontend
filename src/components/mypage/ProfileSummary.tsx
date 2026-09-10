import { UserRound } from "lucide-react";
import type { UserProfile } from "@/types/mypage";

interface ProfileSummaryProps {
  profile: UserProfile;
}

// 프로필 요약. 이미지는 기본 아바타 고정 (업로드는 MVP 범위 밖)
function ProfileSummary({ profile }: ProfileSummaryProps) {
  return (
    <section className="flex w-full items-center gap-3.5">
      <div className="bg-surface-subtle flex size-14 shrink-0 items-center justify-center rounded-full">
        <UserRound size={28} className="text-text-secondary" aria-hidden />
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-text-primary truncate text-[18px] leading-[26px] font-bold">
          {profile.name}
        </p>
        <p className="text-text-secondary text-note-title truncate font-normal">{profile.email}</p>
      </div>
    </section>
  );
}

export default ProfileSummary;
