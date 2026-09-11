import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 2_400;

export function useToast(durationMs = DEFAULT_DURATION_MS) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef(0);

  const show = useCallback(
    (next: string) => {
      window.clearTimeout(timerRef.current);
      setMessage(next);
      timerRef.current = window.setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs],
  );

  const hide = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setMessage(null);
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { message, show, hide };
}
