import { useEffect } from "react";
import { authFetch, hasAuthCredentials } from "../utils/auth/auth.js";

const PRESENCE_INTERVAL_MS = 60_000;

/** Gửi heartbeat lên server khi user đã đăng nhập và tab đang mở. */
export function useUserPresence() {
  useEffect(() => {
    if (!hasAuthCredentials()) return undefined;

    const ping = () => {
      if (document.visibilityState === "hidden") return;
      void authFetch("/api/auth/presence", { method: "POST" }).catch(() => {});
    };

    ping();
    const timer = window.setInterval(ping, PRESENCE_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
