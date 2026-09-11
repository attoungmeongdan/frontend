import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { installVoiceUnlock } from "@/utils/voice";

// 운동 화면은 시작 자세를 자동으로 잡아 탭이 없다. 앱의 첫 탭에서 음성 재생 권한을 미리 열어 둔다
installVoiceUnlock();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
