import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo/fittle-logo-ggubuk.png";

// 스플래시가 머무는 시간. 실제 부팅 작업(토큰 확인 등)이 생기면 그 완료 시점으로 대체한다.
const SPLASH_DURATION_MS = 1800;

// Screen/Splash (vyQNR) — 로고 200 + 스피너 44, 세로 gap 32
function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    // pb-20 으로 콘텐츠를 정중앙보다 위로 올린다 (로그인 화면 로고 위치와 맞춤)
    <div className="flex h-full flex-col items-center justify-center gap-8 pb-20">
      <img src={logo} alt="Fittle" className="size-50 object-contain" />
      <div
        role="progressbar"
        aria-label="불러오는 중"
        className="border-border-default border-t-brand-teal size-11 animate-spin rounded-full border-4"
      />
    </div>
  );
}

export default SplashPage;
