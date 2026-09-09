import googleMark from "@/assets/social/google.svg";
import kakaoMark from "@/assets/social/kakao.svg";
import type { SocialProvider } from "@/apis/auth";

interface SocialLoginButtonsProps {
  onSelect: (provider: SocialProvider) => void;
  disabled?: boolean;
}

// Feature/SocialLoginButtons (GaTOb) — 폭 330, 버튼 높이 52, radius 16, 세로 gap 12
// 로고는 Dear.E 프로젝트의 SVG를 그대로 사용
function SocialLoginButtons({ onSelect, disabled = false }: SocialLoginButtonsProps) {
  return (
    <div className={`flex w-[330px] flex-col gap-3 ${disabled ? "opacity-50" : ""}`}>
      <button
        type="button"
        onClick={() => onSelect("kakao")}
        disabled={disabled}
        className="bg-kakao-yellow rounded-input text-button text-kakao-label relative flex h-13 items-center justify-center"
      >
        <img src={kakaoMark} alt="" draggable={false} className="absolute left-4 h-5 w-[21px]" />
        카카오로 시작하기
      </button>

      <button
        type="button"
        onClick={() => onSelect("google")}
        disabled={disabled}
        className="border-google-border rounded-input text-button text-text-primary relative flex h-13 items-center justify-center border bg-white"
      >
        <img src={googleMark} alt="" draggable={false} className="absolute left-4 size-5" />
        Google로 시작하기
      </button>
    </div>
  );
}

export default SocialLoginButtons;
