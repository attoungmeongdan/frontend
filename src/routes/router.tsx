import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import CalendarPage from "@/pages/CalendarPage";
import ExercisePage from "@/pages/ExercisePage";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import MapPage from "@/pages/MapPage";
import MeasurePage from "@/pages/MeasurePage";
import MyPage from "@/pages/MyPage";
import NotFoundPage from "@/pages/NotFoundPage";
import OAuthCallbackPage from "@/pages/OAuthCallbackPage";
import OnboardingPage from "@/pages/OnboardingPage";
import SplashPage from "@/pages/SplashPage";
import type { LayoutHandle } from "@/types/layout";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/splash",
        element: <SplashPage />,
        handle: { header: false, fullBleed: true } satisfies LayoutHandle,
      },
      {
        path: "/login",
        element: <LoginPage />,
        handle: { header: false, fullBleed: true } satisfies LayoutHandle,
      },
      {
        // 서버에 등록된 redirect_uri 와 정확히 같아야 한다
        path: "/auth/oauth2/:provider/callback",
        element: <OAuthCallbackPage />,
        handle: { header: false, fullBleed: true } satisfies LayoutHandle,
      },
      {
        path: "/onboarding",
        element: <OnboardingPage />,
        handle: { header: false, fullBleed: true } satisfies LayoutHandle,
      },
      {
        path: "/",
        element: <HomePage />,
        handle: { bottomNav: true } satisfies LayoutHandle,
      },
      {
        path: "/exercise/:type",
        element: <ExercisePage />,
        handle: {
          header: false,
          fullBleed: true,
          fullViewport: true,
        } satisfies LayoutHandle,
      },
      {
        path: "/measure",
        element: <MeasurePage />,
        handle: {
          header: false,
          fullBleed: true,
          fullViewport: true,
        } satisfies LayoutHandle,
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
