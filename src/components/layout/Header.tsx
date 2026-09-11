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
    // 노치·다이나믹 아일랜드 회피는 AppLayout 의 pt-[env(safe-area-inset-top)] 가 이미 한다.
    // 여기서 또 safe-area 를 더하면 PWA(standalone)에서 두 번 밀려 상단이 크게 벌어진다
    // 높이 44px(행 44) + 상단 8px = 52px
    <header className="bg-surface-default box-content flex h-11 shrink-0 flex-col justify-end px-2 pt-2">
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
