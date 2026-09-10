import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logout } from "@/apis/auth";
import { getMyProfile, withdraw } from "@/apis/user";
import { ACCOUNT_ACTION_ERROR } from "@/constants/mypage";

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
 * 로그아웃·탈퇴. 성공하면 로그인 화면으로 보낸다.
 * 세션이 끊긴 상태라 뒤로 가기로 돌아오지 못하게 replace 로 이동한다.
 */
export function useAccountActions({ onError }: AccountActionOptions) {
  const navigate = useNavigate();

  const goToLogin = () => navigate("/login", { replace: true });

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
