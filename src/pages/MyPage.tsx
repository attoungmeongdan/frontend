import { LogOut, TriangleAlert } from "lucide-react";
import { useState } from "react";
import turtleSad from "@/assets/mascots/turtle-sad.png";
import PersonalInfoList from "@/components/mypage/PersonalInfoList";
import ProfileError from "@/components/mypage/ProfileError";
import ProfileSkeleton from "@/components/mypage/ProfileSkeleton";
import ProfileSummary from "@/components/mypage/ProfileSummary";
import ToastHost from "@/components/common/ToastHost";
import RecommendationSection from "@/components/mypage/RecommendationSection";
import Button from "@/components/ui/Button";
import MascotModal from "@/components/ui/MascotModal";
import { ACCOUNT_ACTIONS, WITHDRAW_CONFIRM } from "@/constants/mypage";
import { useAccountActions, useMyProfile } from "@/hooks/useMyPage";
import { usePersonalInfoEdit } from "@/hooks/usePersonalInfoEdit";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useToast } from "@/hooks/useToast";
import { toPersonalInfoItems } from "@/utils/user";

const TOAST_DURATION_MS = 3_000;

function MyPage() {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const toast = useToast(TOAST_DURATION_MS);

  const profileQuery = useMyProfile();
  const { logoutMutation, withdrawMutation } = useAccountActions({ onError: toast.show });
  const personalInfoEdit = usePersonalInfoEdit({
    profile: profileQuery.data,
    onError: toast.show,
  });

  const recommendation = useRecommendations();

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

      <ToastHost
        message={toast.message}
        size="default"
        icon={TriangleAlert}
        iconClassName="text-feedback-error"
      />
    </div>
  );
}

export default MyPage;
