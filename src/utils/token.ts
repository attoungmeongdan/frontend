const ACCESS_TOKEN_KEY = "accessToken";

export function saveAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(token));
}

export function getAccessToken(): string | null {
  const item = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!item) {
    return null;
  }

  try {
    return JSON.parse(item) as string;
  } catch {
    return null;
  }
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}
