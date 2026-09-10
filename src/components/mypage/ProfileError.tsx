import { TriangleAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { PROFILE_ERROR } from "@/constants/mypage";

interface ProfileErrorProps {
  onRetry: () => void;
}

// 프로필 조회 실패. 시안에 정의가 없어 추천 실패 화면과 같은 형태로 맞췄다
function ProfileError({ onRetry }: ProfileErrorProps) {
  return (
    <div
      role="alert"
      className="bg-surface-subtle flex flex-col items-center gap-2.5 rounded-2xl p-6"
    >
      <TriangleAlert size={32} className="text-feedback-error" aria-hidden />
      <p className="text-text-primary text-body font-bold">{PROFILE_ERROR.title}</p>
      <Button className="w-full" onClick={onRetry}>
        {PROFILE_ERROR.action}
      </Button>
    </div>
  );
}

export default ProfileError;
