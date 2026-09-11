import { LogOut, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import turtleSad from "@/assets/mascots/turtle-sad.webp";
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
import { useRecommendations } from "@/hooks/useRecommendations";
import { toPersonalInfoItems } from "@/utils/user";

const TOAST_DURATION = 3000;

// 10_Mypage — /mypage
function MyPage() {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // 사라질 때 페이드를 주려면 opacity 를 먼저 0 으로 만든 뒤 전환이 끝나고 내려야 한다
  const [isToastVisible, setIsToastVisible] = useState(false);

  const profileQuery = useMyProfile();
  const { logoutMutation, withdrawMutation } = useAccountActions({ onError: setToastMessage });
  const personalInfoEdit = usePersonalInfoEdit({
    profile: profileQuery.data,
    onError: setToastMessage,
  });

  const recommendation = useRecommendations();

  useEffect(() => {
    if (toastMessage === null) return;

    setIsToastVisible(true);

    const timer = setTimeout(() => setIsToastVisible(false), TOAST_DURATION);

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
            saveFeedback={personalInfoEdit.saveFeedback}
            onStartEdit={personalInfoEdit.startEdit}
            onCancelEdit={personalInfoEdit.cancelEdit}
            onSave={personalInfoEdit.save}
            onSaveFeedbackEnd={personalInfoEdit.endSaveFeedback}
            onChangeAge={personalInfoEdit.changeAge}
            onChangeGender={personalInfoEdit.changeGender}
            onChangeHeight={personalInfoEdit.changeHeight}
            onChangeWeight={personalInfoEdit.changeWeight}
          />
        </>
      )}

      <RecommendationSection
        status={recommendation.status}
        recommendations={recommendation.recommendations}
        onRetry={recommendation.retry}
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
        <div
          onTransitionEnd={() => {
            if (!isToastVisible) setToastMessage(null);
          }}
          className={`pointer-events-none fixed inset-x-0 bottom-[134px] z-50 flex justify-center px-5 transition-opacity duration-500 motion-reduce:transition-none ${
            isToastVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-full max-w-[378px]">
            <Toast
              message={toastMessage}
              icon={TriangleAlert}
              iconClassName="text-feedback-error"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPage;
