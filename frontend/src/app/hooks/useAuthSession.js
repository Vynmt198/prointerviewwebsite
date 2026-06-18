import { useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT, getUser, hasAuthCredentials } from "../utils/auth/auth.js";

/** Re-render khi login / logout / refresh token (cùng tab hoặc tab khác). */
export function useAuthSession() {
  const [, tick] = useState(0);

  useEffect(() => {
    const onChange = () => tick((n) => n + 1);
    window.addEventListener(AUTH_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return {
    loggedIn: hasAuthCredentials(),
    user: getUser(),
  };
}
