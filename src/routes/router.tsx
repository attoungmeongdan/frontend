import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import CalendarPage from "@/pages/CalendarPage";
import ExerciseCompletePage from "@/pages/ExerciseCompletePage";
import ExercisePage from "@/pages/ExercisePage";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import MapPage from "@/pages/MapPage";
import MeasurePage from "@/pages/MeasurePage";
import MeasurementAnalysisPage from "@/pages/MeasurementAnalysisPage";
import MyPage from "@/pages/MyPage";
import NotFoundPage from "@/pages/NotFoundPage";
import OAuthCallbackPage from "@/pages/OAuthCallbackPage";
import OnboardingPage from "@/pages/OnboardingPage";
import SplashPage from "@/pages/SplashPage";
import AuthGate from "@/routes/AuthGate";
import type { LayoutHandle } from "@/types/layout";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      // 세션 판정 전/후 모두 지나가는 화면
      {
        path: "/splash",
        element: <SplashPage />,
        handle: { header: false, fullBleed: true } satisfies LayoutHandle,
      },
      {
        // 서버에 등록된 redirect_uri 와 정확히 같아야 한다.
        // 여기서 세션이 만들어지므로 가드를 걸지 않는다.
        path: "/auth/oauth2/:provider/callback",
        element: <OAuthCallbackPage />,
        handle: { header: false, fullBleed: true } satisfies LayoutHandle,
      },

      // 로그인 전 화면
      {
        element: <AuthGate allow="unauthenticated" />,
        children: [
          {
            path: "/login",
            element: <LoginPage />,
            handle: { header: false, fullBleed: true } satisfies LayoutHandle,
          },
        ],
      },

      // 소셜 인증은 됐지만 가입을 안 끝낸 상태에서만 들어올 수 있다
      {
        element: <AuthGate allow="signup_required" />,
        children: [
          {
            path: "/onboarding",
            element: <OnboardingPage />,
            handle: { header: false, fullBleed: true } satisfies LayoutHandle,
          },
        ],
      },

      // 로그인해야 볼 수 있는 화면
      {
        element: <AuthGate allow="authenticated" />,
        children: [
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
            path: "/exercise/:type/complete",
            element: <ExerciseCompletePage />,
            handle: {
              header: { title: "운동 마무리", showClose: true },
              bottomNav: false,
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
            path: "/measurements/:id/analysis",
            element: <MeasurementAnalysisPage />,
            handle: {
              header: { title: "측정 분석", showClose: true },
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
        ],
      },

      {
        path: "*",
        element: <NotFoundPage />,
        handle: { header: { showBack: true, backTo: "/" } } satisfies LayoutHandle,
      },
    ],
  },
]);
