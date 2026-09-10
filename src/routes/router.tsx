import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import CalendarPage from "@/pages/CalendarPage";
import HomePage from "@/pages/HomePage";
import MapPage from "@/pages/MapPage";
import MyPage from "@/pages/MyPage";
import NotFoundPage from "@/pages/NotFoundPage";
import type { LayoutHandle } from "@/types/layout";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
        handle: { bottomNav: true } satisfies LayoutHandle,
      },
      {
        path: "/calendar",
        element: <CalendarPage />,
        handle: {
          header: { title: "캘린더", showBack: true, backTo: "/" },
          bottomNav: true,
        } satisfies LayoutHandle,
      },
      {
        path: "/map",
        element: <MapPage />,
        handle: {
          header: { title: "지도", showBack: true, backTo: "/" },
          bottomNav: true,
          fullBleed: true,
        } satisfies LayoutHandle,
      },
      {
        path: "/mypage",
        element: <MyPage />,
        handle: {
          header: { title: "마이페이지", showBack: true, backTo: "/" },
          bottomNav: true,
        } satisfies LayoutHandle,
      },
      {
        path: "*",
        element: <NotFoundPage />,
        handle: { header: { showBack: true, backTo: "/" } } satisfies LayoutHandle,
      },
    ],
  },
]);
