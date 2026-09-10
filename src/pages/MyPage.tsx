import { LogOut } from "lucide-react";
import { useState } from "react";
import turtleSad from "@/assets/mascots/turtle-sad.png";
import PersonalInfoList from "@/components/mypage/PersonalInfoList";
import ProfileSummary from "@/components/mypage/ProfileSummary";
import RecommendationSection from "@/components/mypage/RecommendationSection";
import Button from "@/components/ui/Button";
import MascotModal from "@/components/ui/MascotModal";
import { ACCOUNT_ACTIONS, WITHDRAW_CONFIRM } from "@/constants/mypage";
import {
  PERSONAL_INFO_MOCK,
  PROFILE_MOCK,
  RECOMMENDATION_STATUS,
  RECOMMENDATIONS_MOCK,
} from "@/mocks/mypage";

// 10_Mypage — /mypage
function MyPage() {
  // API 연동 전이라 목데이터를 그대로 쓴다
  const status = RECOMMENDATION_STATUS;
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // 실제 로그아웃·탈퇴 처리와 추천 재요청은 API 연동 이슈에서 붙인다.
  // 재시도 결과는 응답에 따라 추천·매칭 없음·실패로 갈리므로 여기서 임의로 정하지 않는다
  const handleLogout = () => {};
  const handleWithdraw = () => setIsWithdrawOpen(false);
  const handleRetry = () => {};

  return (
    <div className="flex flex-col gap-3">
      <ProfileSummary profile={PROFILE_MOCK} />
      <PersonalInfoList items={PERSONAL_INFO_MOCK} />

      <div className="flex w-full gap-3">
        <Button variant="secondary" leadingIcon={LogOut} className="flex-1" onClick={handleLogout}>
          {ACCOUNT_ACTIONS.logout}
        </Button>
        <Button
          variant="destructive"
          className="w-[130px] shrink-0"
          onClick={() => setIsWithdrawOpen(true)}
        >
          {ACCOUNT_ACTIONS.withdraw}
        </Button>
      </div>

      <RecommendationSection
        status={status}
        recommendations={RECOMMENDATIONS_MOCK}
        onRetry={handleRetry}
      />

      {isWithdrawOpen && (
        <MascotModal
          mascot={turtleSad}
          title={WITHDRAW_CONFIRM.title}
          body={WITHDRAW_CONFIRM.body}
          primaryAction={{
            label: WITHDRAW_CONFIRM.cancel,
            onClick: () => setIsWithdrawOpen(false),
          }}
          secondaryAction={{ label: WITHDRAW_CONFIRM.confirm, onClick: handleWithdraw }}
          secondaryVariant="destructive"
          onClose={() => setIsWithdrawOpen(false)}
        />
      )}
    </div>
  );
}

export default MyPage;
