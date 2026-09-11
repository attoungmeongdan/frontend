import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { handleOAuthCallback, refreshAccessToken, type SocialProvider } from "@/apis/auth";
import { setAccessToken } from "@/apis/tokenStore";
import BootSplash from "@/components/common/BootSplash";
import { useAuth } from "@/hooks/useAuth";

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: SocialProvider }>();
  const [searchParams] = useSearchParams();
  const { markAuthenticated, markSignupRequired } = useAuth();
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
          markSignupRequired();
          navigate("/onboarding", { replace: true });
          return;
        }

        const { accessToken } = await refreshAccessToken();
        setAccessToken(accessToken);
        markAuthenticated();
        navigate("/", { replace: true });
      } catch {
        navigate("/login?error=oauth", { replace: true });
      }
    };

    void run();
  }, [markAuthenticated, markSignupRequired, navigate, provider, searchParams]);

  return <BootSplash label="로그인 처리 중" />;
}

export default OAuthCallbackPage;
