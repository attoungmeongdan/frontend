import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { handleOAuthCallback, refreshAccessToken, type SocialProvider } from "@/apis/auth";
import { saveAccessToken } from "@/utils/token";
import logo from "@/assets/logo/fittle-logo-ggubuk.png";

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: SocialProvider }>();
  const [searchParams] = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) {
      return;
    }
    hasRun.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if ((provider !== "kakao" && provider !== "google") || !code || !state) {
      navigate("/login", { replace: true });
      return;
    }

    const run = async () => {
      try {
        const resultType = await handleOAuthCallback(provider, code, state);

        if (resultType === "SIGNUP_REQUIRED") {
          navigate("/onboarding", { replace: true });
          return;
        }

        const { accessToken } = await refreshAccessToken();
        saveAccessToken(accessToken);
        navigate("/", { replace: true });
      } catch {
        navigate("/login?error=oauth", { replace: true });
      }
    };

    void run();
  }, [navigate, provider, searchParams]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 pb-20">
      <img src={logo} alt="Fittle" className="size-50 object-contain" />
      <div
        role="progressbar"
        aria-label="로그인 처리 중"
        className="border-border-default border-t-brand-teal size-11 animate-spin rounded-full border-4"
      />
    </div>
  );
}

export default OAuthCallbackPage;
