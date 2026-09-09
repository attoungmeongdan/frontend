import { CalendarDays, House, MapPin, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "홈", icon: House },
  { to: "/calendar", label: "캘린더", icon: CalendarDays },
  { to: "/map", label: "지도", icon: MapPin },
  { to: "/mypage", label: "마이", icon: UserRound },
];
