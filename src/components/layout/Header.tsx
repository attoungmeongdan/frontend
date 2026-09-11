import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import wordmark from "@/assets/logo/fittle-wordmark.png";
import type { HeaderConfig } from "@/types/layout";

type HeaderProps = HeaderConfig & {
  onBack?: () => void;
};

function Header({ title, showBack = false, showClose = false, backTo, onBack }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (backTo) {
      navigate(backTo);
      return;
    }
    navigate(-1);
  };

  return (
    // 아이폰 노치·다이나믹 아일랜드 아래로 내리고, safe-area 가 없는 기기도 최소 8px 은 띄운다
    // 높이 44px(행 44) + 상단 8px = 52px
    <header className="bg-surface-default box-content flex h-11 shrink-0 flex-col justify-end px-2 pt-[max(8px,env(safe-area-inset-top))]">
      {/* 44px 버튼 높이에 맞춘 행, 버튼·제목을 세로 중앙에 둔다 */}
      <div className="flex h-11 items-center justify-between">
        <div className="flex size-11 items-center justify-center">
          {showBack && (
            <button
              type="button"
              aria-label="뒤로 가기"
              onClick={handleBack}
              className="text-text-primary flex size-11 items-center justify-center"
            >
              <ArrowLeft size={24} aria-hidden />
            </button>
          )}
        </div>

        {title ? (
          <h1 className="text-text-primary text-title">{title}</h1>
        ) : (
          <img src={wordmark} alt="Fittle" className="h-7 w-21 object-contain" />
        )}

        <div className="flex size-11 items-center justify-center">
          {showClose && (
            <button
              type="button"
              aria-label="닫고 홈으로 돌아가기"
              onClick={() => navigate("/")}
              className="text-text-primary flex size-11 items-center justify-center"
            >
              <X size={24} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
