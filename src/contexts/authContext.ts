import { createContext } from "react";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  markAuthenticated: () => void;
  markSignedOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
