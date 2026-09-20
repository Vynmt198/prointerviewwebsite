import { useState } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "../../hooks/useCart.jsx";
import { hasAuthCredentials, getUser } from "../../utils/auth/auth.js";
import { buildLoginPath } from "../../utils/auth/authGate.js";
import { toastApiError, toastApiSuccess } from "../../utils/shared/apiToast.js";

export function AddCourseToCartButton({ courseId, className = "" }) {
  const { cart, add } = useCart();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const user = getUser();
  if (user && user.role !== "customer") return null;
  const inCart = cart.items.some((item) => String(item.courseId) === String(courseId));
  const handleClick = async (event) => {
    event.stopPropagation();
    if (!hasAuthCredentials()) { navigate(buildLoginPath(`/courses/${courseId}`)); return; }
    if (inCart) { navigate("/cart"); return; }
    setBusy(true);
    try { await add(courseId); toastApiSuccess("Đã thêm khóa học vào giỏ hàng."); }
    catch (error) { toastApiError(error.message); }
    finally { setBusy(false); }
  };
  const Icon = inCart ? Check : ShoppingCart;
  return <button type="button" disabled={busy} onClick={handleClick}
    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50 ${className}`}>
    <Icon className="size-4" />{busy ? "Đang thêm…" : inCart ? "Xem giỏ hàng" : "Thêm vào giỏ"}
  </button>;
}
