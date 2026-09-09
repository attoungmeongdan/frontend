import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import wordmark from "@/assets/logo/fittle-wordmark.png";
import type { HeaderConfig } from "@/types/layout";

type HeaderProps = HeaderConfig & {
  onBack?: () => void;
};

function Header({ title, showBack = false, backTo, onBack }: HeaderProps) {
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
    <header className="bg-surface-default flex h-14 shrink-0 items-center justify-between px-2">
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

      <div className="size-11" />
    </header>
  );
}

export default Header;
