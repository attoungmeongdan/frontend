import { CalendarDays, House, MapPin, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

// 마이페이지는 탭이 아니라 헤더 우상단 프로필 버튼으로 들어간다
export const NAV_ITEMS: NavItem[] = [
  { to: "/group", label: "그룹", icon: Users },
  { to: "/", label: "홈", icon: House },
  { to: "/calendar", label: "캘린더", icon: CalendarDays },
  { to: "/map", label: "지도", icon: MapPin },
];
