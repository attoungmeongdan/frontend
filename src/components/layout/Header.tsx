import { ArrowLeft, UserRound, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import wordmark from "@/assets/logo/fittle-wordmark.png";
import type { HeaderConfig } from "@/types/layout";

type HeaderProps = HeaderConfig & {
  onBack?: () => void;
};

function Header({
  title,
  showBack = false,
  showClose = false,
  showProfile = false,
  backTo,
  onBack,
}: HeaderProps) {
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
    // 높이 84px + 상단 8px = 92px
    <header className="bg-surface-default box-content flex h-21 shrink-0 flex-col justify-end px-2 pt-[max(8px,env(safe-area-inset-top))]">
      {/* 버튼·제목 중심이 84px 의 48px 지점에 오도록 56px 행을 아래에서 8px 띄운다 */}
      <div className="mb-2 flex h-14 items-center justify-between">
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
          {showClose ? (
            <button
              type="button"
              aria-label="닫고 홈으로 돌아가기"
              onClick={() => navigate("/")}
              className="text-text-primary flex size-11 items-center justify-center"
            >
              <X size={24} aria-hidden />
            </button>
          ) : (
            showProfile && (
              <NavLink
                to="/mypage"
                aria-label="마이페이지"
                className="flex size-11 items-center justify-center"
              >
                {({ isActive }) => (
                  <UserRound
                    size={24}
                    aria-hidden
                    className={isActive ? "text-brand-teal" : "text-text-primary"}
                  />
                )}
              </NavLink>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
