import { Outlet, useMatches } from "react-router-dom";
import BottomNavigation from "@/components/layout/BottomNavigation";
import Header from "@/components/layout/Header";
import type { LayoutHandle } from "@/types/layout";

function AppLayout() {
  const matches = useMatches();
  const handle = (matches[matches.length - 1]?.handle ?? {}) as LayoutHandle;
  const { header = {}, bottomNav = false, fullBleed = false, fullViewport = false } = handle;

  return (
    <div className="bg-surface-subtle flex h-dvh justify-center">
      {/* PWA(standalone)에서는 상태바가 화면 위로 겹쳐 들어온다.
          safe-area 만큼 밀어내야 헤더가 상태바에 가리지 않는다.
          fullViewport 카메라는 CameraStage에서 네 방향 safe area를 적용한다 */}
      <div
        className={`bg-surface-default flex h-full w-full flex-col overflow-hidden ${fullViewport ? "" : "max-w-shell pt-[env(safe-area-inset-top)]"}`}
      >
        {!fullViewport && header !== false && (
          <Header
            title={header.title}
            showBack={header.showBack}
            showClose={header.showClose}
            showProfile={header.showProfile}
            backTo={header.backTo}
          />
        )}

        <main
          className={
            fullViewport || fullBleed
              ? "min-h-0 flex-1 overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1.5 pb-3"
          }
        >
          <Outlet />
        </main>

        {!fullViewport && bottomNav && <BottomNavigation />}
      </div>
    </div>
  );
}

export default AppLayout;
