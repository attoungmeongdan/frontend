import { useMutation, useQuery } from "@tanstack/react-query";
import { logout } from "@/apis/auth";
import { getMyProfile, withdraw } from "@/apis/user";
import { ACCOUNT_ACTION_ERROR } from "@/constants/mypage";
import { useAuth } from "@/hooks/useAuth";

export const MY_PROFILE_QUERY_KEY = ["user", "me"] as const;

/** 마이페이지 프로필 조회 */
export function useMyProfile() {
  return useQuery({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: getMyProfile,
  });
}

interface AccountActionOptions {
  onError: (message: string) => void;
}

/**
 * 로그아웃·탈퇴.
 * 화면 이동은 직접 하지 않는다. 인증 상태만 바꾸면 라우트 가드가 로그인 화면으로 보낸다.
 * 직접 이동하면 상태가 authenticated 로 남아 있어 가드가 다시 홈으로 되돌린다.
 */
export function useAccountActions({ onError }: AccountActionOptions) {
  const { markSignedOut } = useAuth();

  const goToLogin = markSignedOut;

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: goToLogin,
    onError: () => onError(ACCOUNT_ACTION_ERROR.logout),
  });

  const withdrawMutation = useMutation({
    mutationFn: withdraw,
    onSuccess: goToLogin,
    onError: () => onError(ACCOUNT_ACTION_ERROR.withdraw),
  });

  return { logoutMutation, withdrawMutation };
}
