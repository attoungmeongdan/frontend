import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/constants/navigation";

// UI/BottomNavigation (K7mpm) — 아이템 60px, 상단 1px 보더
// 보더와 아이콘이 붙어 보여 시안보다 위쪽에 12px 더 띄운다
// 하단은 최소 10px, 홈 인디케이터가 있는 기기는 safe-area 만큼 띄운다
function BottomNavigation() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="border-border-default bg-surface-default shrink-0 border-t pt-3 pb-[max(10px,env(safe-area-inset-bottom))]"
    >
      <ul className="flex h-15 items-center">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="h-full flex-1">
            <NavLink
              to={to}
              end={to === "/"}
              className="flex h-full flex-col items-center justify-center gap-1"
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={24}
                    aria-hidden
                    className={isActive ? "text-nav-active-icon" : "text-text-secondary"}
                  />
                  <span
                    className={
                      isActive
                        ? "text-nav-active-label text-caption font-bold"
                        : "text-text-secondary text-caption"
                    }
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default BottomNavigation;
