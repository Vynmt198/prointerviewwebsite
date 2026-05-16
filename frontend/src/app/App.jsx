import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { restoreSession } from "./utils/auth";

export default function App() {
  // Khôi phục phiên JWT (/api/auth/me) sau khi refresh trang
  // after a page refresh. We show nothing until the check is done to avoid
  // a flash where protected pages redirect the user away unnecessarily.
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // VNPay FIX: Nếu thấy tham số vnp_ ở URL gốc (trước dấu #), chuyển hướng vào router nội bộ
    if (window.location.search.includes("vnp_ResponseCode")) {
      const search = window.location.search;
      // Chuyển params vào sau dấu # để HashRouter nhận diện được
      window.location.href = window.location.origin + window.location.pathname + "#/payment-return" + search;
      return;
    }

    restoreSession()
      .catch((err) => console.log("restoreSession error:", err))
      .finally(() => setSessionChecked(true));
  }, []);

  if (!sessionChecked) {
    // Minimal full-screen loader — matches brand purple
    return (
      <div
        className="relative flex min-h-screen items-center justify-center bg-[#f3f0f9]"
      >
        <div className="flex flex-col items-center gap-5">
            <img src="/logo-mark.png?v=8" alt="ProInterview" className="h-16 w-auto object-contain sm:h-20" />
          <div
            className="h-7 w-7 animate-spin rounded-full border-2 border-[#6E35E8]/25 border-t-[#6E35E8]"
            role="status"
            aria-label="Đang tải"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}