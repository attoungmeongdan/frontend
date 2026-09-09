import { useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { startSocialLogin, type SocialProvider } from "@/apis/auth";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import Toast from "@/components/ui/Toast";
import wordmark from "@/assets/logo/fittle-wordmark.png";

type LoginStatus = "idle" | "loading" | "error";

// 백엔드 인증 연동 전까지 로그인을 건너뛰고 바로 홈으로 보낸다.
// 연동할 때 false 로 바꾸면 아래 처리중/오류 흐름이 그대로 살아난다.
const SKIP_LOGIN: boolean = true;

// Screen/Login-default · Login-loading · Login-error (RcvEg / AmW9e / tAcXS)
function LoginPage() {
  const [status, setStatus] = useState<LoginStatus>("idle");
  const navigate = useNavigate();

  const handleSelect = (provider: SocialProvider) => {
    if (SKIP_LOGIN) {
      navigate("/", { replace: true });
      return;
    }

    setStatus("loading");

    try {
      startSocialLogin(provider);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-10">
        <img src={wordmark} alt="Fittle" className="h-15 w-45 object-contain" />

        <p className="text-body text-text-secondary text-center whitespace-pre-line">
          {"간단하게, 내 체력을 확인해요\n꾸준하게, 매일 운동을 기록해요"}
        </p>

        <SocialLoginButtons onSelect={handleSelect} disabled={status === "loading"} />

        {/* 상태 뱃지 자리를 항상 확보해서 상태가 바뀌어도 로고가 움직이지 않게 한다 */}
        <div className="flex min-h-11 items-center">
          {status === "loading" && (
            <div className="bg-surface-subtle rounded-pill flex items-center gap-2 px-4 py-2.5">
              <LoaderCircle size={20} aria-hidden className="text-brand-teal-strong animate-spin" />
              <span className="text-body text-brand-teal-strong font-semibold">
                로그인 처리 중이에요…
              </span>
            </div>
          )}
        </div>
      </div>

      {status === "error" && (
        <div className="absolute inset-x-5 bottom-6">
          <Toast
            message={"로그인이 취소되었어요.\n다시 시도해 주세요."}
            icon={TriangleAlert}
            iconClassName="text-accent-yellow"
            action={{ label: "재시도", onClick: () => setStatus("idle") }}
          />
        </div>
      )}
    </div>
  );
}

export default LoginPage;
