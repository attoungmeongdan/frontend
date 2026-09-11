import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import { GROUP_JOIN } from "@/constants/groupJoin";
import { useAuth } from "@/hooks/useAuth";
import { useGroupMutations } from "@/hooks/useGroups";
import { toGroupErrorMessage } from "@/utils/groupError";
import { rememberInviteJoin } from "@/utils/inviteRedirect";

type JoinState = "joining" | "joined" | "failed";

/**
 * 초대 링크 진입점 (/groups/join?inviteCode=XXX).
 * 서버가 주는 초대 링크가 이 주소를 가리키므로 로그인 가드 밖에 둔다.
 * - 로그인 상태: 바로 참가시킨다
 * - 미로그인: 바로 로그인으로 보낸다. 참가는 서버가 로그인·가입을 마치며 알아서 처리하고,
 *   끝나면 그룹 화면으로 돌아온다
 */
function GroupJoinPage() {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("inviteCode")?.trim() ?? "";
  const { status } = useAuth();

  if (status === "loading") return <CenteredSpinner />;
  if (!inviteCode) return <InvalidInvite />;
  // 가입을 안 끝낸 상태면 서버가 signup_token 에 코드를 담아 두었다. 가입만 마치면 된다
  if (status === "signup_required") return <Navigate to="/onboarding" replace />;
  if (status === "unauthenticated") return <RedirectToLogin inviteCode={inviteCode} />;

  return <AutoJoin inviteCode={inviteCode} />;
}

function CenteredSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoaderCircle size={24} aria-hidden className="text-brand-teal-strong animate-spin" />
    </div>
  );
}

/** 로그인 상태 — 화면에 들어오자마자 참가시킨다 */
function AutoJoin({ inviteCode }: { inviteCode: string }) {
  const navigate = useNavigate();
  const { join } = useGroupMutations();
  const [state, setState] = useState<JoinState>("joining");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // StrictMode 이중 실행으로 참가 요청이 두 번 나가지 않게 막는다
  const hasRequested = useRef(false);
  const joinMutate = join.mutate;

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    joinMutate(inviteCode, {
      onSuccess: () => setState("joined"),
      onError: (error) => {
        setErrorMessage(toGroupErrorMessage(error));
        setState("failed");
      },
    });
  }, [inviteCode, joinMutate]);

  if (state === "joining") {
    return (
      <Message icon={<LoaderCircle size={40} className="text-brand-mint animate-spin" />}>
        <h1 className="text-text-primary text-title font-bold">{GROUP_JOIN.joining}</h1>
      </Message>
    );
  }

  if (state === "failed") {
    return (
      <Message icon={<TriangleAlert size={40} className="text-feedback-error" />}>
        <h1 className="text-text-primary text-title font-bold">{GROUP_JOIN.failedTitle}</h1>
        <p className="text-text-secondary text-body-small text-center leading-normal">
          {errorMessage}
        </p>
        <Button type="button" onClick={() => navigate("/")} className="w-full">
          {GROUP_JOIN.homeAction}
        </Button>
      </Message>
    );
  }

  return (
    <Message icon={<CheckCircle2 size={40} className="text-brand-mint" />}>
      <h1 className="text-text-primary text-title font-bold">{GROUP_JOIN.successTitle}</h1>
      <Button
        type="button"
        onClick={() => navigate("/group", { replace: true })}
        className="w-full"
      >
        {GROUP_JOIN.successAction}
      </Button>
    </Message>
  );
}

/** 미로그인 — 안내 없이 로그인 화면으로 넘긴다. 코드는 로그인 주소에 실려 서버로 간다 */
function RedirectToLogin({ inviteCode }: { inviteCode: string }) {
  // 로그인·가입을 마친 뒤 그룹으로 돌아오기 위한 표시
  rememberInviteJoin();

  return <Navigate to={`/login?inviteCode=${encodeURIComponent(inviteCode)}`} replace />;
}

function InvalidInvite() {
  return (
    <Message icon={<TriangleAlert size={40} className="text-feedback-error" />}>
      <h1 className="text-text-primary text-title font-bold">{GROUP_JOIN.invalidTitle}</h1>
      <p className="text-text-secondary text-body-small text-center leading-normal whitespace-pre-line">
        {GROUP_JOIN.invalidDescription}
      </p>
    </Message>
  );
}

function Message({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-7 pb-12">
      {icon}
      {children}
    </div>
  );
}

export default GroupJoinPage;
