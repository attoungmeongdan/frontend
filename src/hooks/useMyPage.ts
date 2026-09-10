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

  // logout 은 finally 로 요청 성공 여부와 무관하게 토큰을 지운다.
  // 성공 경로에서만 상태를 바꾸면 실패했을 때 토큰은 없는데 authenticated 로 남아
  // 가드가 보호 화면을 유지하고 이후 요청이 전부 401 이 된다
  const logoutMutation = useMutation({
    mutationFn: logout,
    onError: () => onError(ACCOUNT_ACTION_ERROR.logout),
    onSettled: goToLogin,
  });

  // 탈퇴는 요청이 성공해야 토큰을 지운다. 실패하면 계정이 남아 있으므로 로그인 상태도 유지한다
  const withdrawMutation = useMutation({
    mutationFn: withdraw,
    onSuccess: goToLogin,
    onError: () => onError(ACCOUNT_ACTION_ERROR.withdraw),
  });

  return { logoutMutation, withdrawMutation };
}
