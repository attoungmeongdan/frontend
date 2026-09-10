import { createContext } from "react";

/** signup_required 는 소셜 인증은 됐지만 아직 가입을 안 끝낸 상태 (signup_token 만 있음) */
export type AuthStatus = "loading" | "authenticated" | "signup_required" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  /** 로그인·회원가입으로 토큰을 받은 직후 호출 */
  markAuthenticated: () => void;
  /** 콜백에서 신규 회원으로 판정된 직후 호출 */
  markSignupRequired: () => void;
  /** 로그아웃 직후 호출 */
  markSignedOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** 상태별로 있어야 할 자리. 가드와 스플래시가 같은 기준을 쓴다 */
export const HOME_FOR_STATUS: Record<Exclude<AuthStatus, "loading">, string> = {
  authenticated: "/",
  signup_required: "/onboarding",
  unauthenticated: "/login",
};
