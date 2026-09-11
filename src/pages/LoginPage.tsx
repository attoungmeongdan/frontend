import { useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getAuthorizeUrl, type SocialProvider } from "@/apis/auth";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import Toast from "@/components/ui/Toast";
import wordmark from "@/assets/logo/fittle-wordmark.webp";

type LoginStatus = "idle" | "loading" | "error";

function LoginPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<LoginStatus>(searchParams.get("error") ? "error" : "idle");

  const handleSelect = async (provider: SocialProvider) => {
    setStatus("loading");

    try {
      const authorizeUrl = await getAuthorizeUrl(provider);
      window.location.href = authorizeUrl;
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
