import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import turtleSad from "@/assets/mascots/turtle-sad.png";
import PersonalInfoList from "@/components/mypage/PersonalInfoList";
import ProfileError from "@/components/mypage/ProfileError";
import ProfileSkeleton from "@/components/mypage/ProfileSkeleton";
import ProfileSummary from "@/components/mypage/ProfileSummary";
import RecommendationSection from "@/components/mypage/RecommendationSection";
import Button from "@/components/ui/Button";
import MascotModal from "@/components/ui/MascotModal";
import Toast from "@/components/ui/Toast";
import { ACCOUNT_ACTIONS, WITHDRAW_CONFIRM } from "@/constants/mypage";
import { useAccountActions, useMyProfile } from "@/hooks/useMyPage";
import { usePersonalInfoEdit } from "@/hooks/usePersonalInfoEdit";
import { RECOMMENDATION_STATUS, RECOMMENDATIONS_MOCK } from "@/mocks/mypage";
import { toPersonalInfoItems } from "@/utils/user";

const TOAST_DURATION = 3000;

// 10_Mypage — /mypage
function MyPage() {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const profileQuery = useMyProfile();
  const { logoutMutation, withdrawMutation } = useAccountActions({ onError: setToastMessage });
  const personalInfoEdit = usePersonalInfoEdit({
    profile: profileQuery.data,
    onError: setToastMessage,
  });

  // 추천 운동 API 는 아직 없어 목데이터를 유지한다
  const recommendationStatus = RECOMMENDATION_STATUS;
  const handleRetryRecommendation = () => {};

  useEffect(() => {
    if (toastMessage === null) return;

    const timer = setTimeout(() => setToastMessage(null), TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleWithdraw = () => {
    setIsWithdrawOpen(false);
    withdrawMutation.mutate();
  };

  const isPending = logoutMutation.isPending || withdrawMutation.isPending;
  const profile = profileQuery.data;

  return (
    <div className="flex flex-col gap-3">
      {profileQuery.isPending && <ProfileSkeleton />}
      {profileQuery.isError && <ProfileError onRetry={() => void profileQuery.refetch()} />}

      {profile && (
        <>
          <ProfileSummary name={profile.nickname} email={profile.email} />
          <PersonalInfoList
            items={toPersonalInfoItems(profile)}
            editingField={personalInfoEdit.editingField}
            editing={personalInfoEdit.editing}
            isSaving={personalInfoEdit.isSaving}
            onStartEdit={personalInfoEdit.startEdit}
            onCancelEdit={personalInfoEdit.cancelEdit}
            onSave={personalInfoEdit.save}
            onChangeAge={personalInfoEdit.changeAge}
            onChangeGender={personalInfoEdit.changeGender}
            onChangeHeight={personalInfoEdit.changeHeight}
            onChangeWeight={personalInfoEdit.changeWeight}
          />
        </>
      )}

      <RecommendationSection
        status={recommendationStatus}
        recommendations={RECOMMENDATIONS_MOCK}
        onRetry={handleRetryRecommendation}
      />

      <div className="flex w-full gap-3">
        <Button
          variant="secondary"
          leadingIcon={LogOut}
          className="flex-1"
          disabled={isPending}
          onClick={() => logoutMutation.mutate()}
        >
          {ACCOUNT_ACTIONS.logout}
        </Button>
        <Button
          variant="destructive"
          className="w-[130px] shrink-0"
          disabled={isPending}
          onClick={() => setIsWithdrawOpen(true)}
        >
          {ACCOUNT_ACTIONS.withdraw}
        </Button>
      </div>

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

      {toastMessage && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-5">
          <div className="max-w-shell w-full">
            <Toast message={toastMessage} />
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPage;
