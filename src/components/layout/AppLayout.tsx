import { Outlet, useMatches } from "react-router-dom";
import BottomNavigation from "@/components/layout/BottomNavigation";
import Header from "@/components/layout/Header";
import type { LayoutHandle } from "@/types/layout";

function AppLayout() {
  const matches = useMatches();
  const handle = (matches[matches.length - 1]?.handle ?? {}) as LayoutHandle;
  const { header = {}, bottomNav = false, fullBleed = false } = handle;

  return (
    <div className="bg-surface-subtle flex h-dvh justify-center">
      <div className="bg-surface-default flex h-full w-full max-w-(--container-shell) flex-col overflow-hidden">
        {header !== false && (
          <Header title={header.title} showBack={header.showBack} backTo={header.backTo} />
        )}

        <main
          className={
            fullBleed
              ? "min-h-0 flex-1 overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1.5 pb-3"
          }
        >
          <Outlet />
        </main>

        {bottomNav && <BottomNavigation />}
      </div>
    </div>
  );
}

export default AppLayout;
