import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/constants/navigation";

// UI/BottomNavigation (K7mpm) — 아이템 60px + safe-area 20px, 상단 1px 보더
function BottomNavigation() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="border-border-default bg-surface-default shrink-0 border-t pb-[max(20px,env(safe-area-inset-bottom))]"
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
                    className={isActive ? "text-brand-teal" : "text-text-secondary"}
                  />
                  <span
                    className={
                      isActive
                        ? "text-brand-teal-strong text-xs font-bold"
                        : "text-text-secondary text-xs"
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
