import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cartApi } from "../api/cartApi.js";
import { getUser, hasAuthCredentials, AUTH_CHANGED_EVENT } from "../utils/auth/auth.js";

const CartContext = createContext(null);
const emptyCart = { items: [], totalAmount: 0, pendingOrder: null };
export function CartProvider({ children }) {
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const account = useRef("");
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const user = getUser();
    const key = hasAuthCredentials() ? String(user?.id || user?._id || "") : "";
    const version = ++revision.current;
    if (account.current !== key) { setCart(emptyCart); account.current = key; }
    if (!key || user?.role !== "customer") { setCart(emptyCart); setLoading(false); setError(""); return; }
    setLoading(true);
    try {
      const result = await cartApi.get();
      if (version === revision.current) { setCart(result.cart); setError(""); }
      return result.cart;
    } catch (err) {
      if (version === revision.current) setError(err.message);
    } finally {
      if (version === revision.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const onAuth = () => void refresh();
    const onStorage = (event) => { if (event.key?.startsWith("prointerview_")) void refresh(); };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuth);
    window.addEventListener("storage", onStorage);
    return () => { revision.current++; window.removeEventListener(AUTH_CHANGED_EVENT, onAuth); window.removeEventListener("storage", onStorage); };
  }, [refresh]);
  const mutate = useCallback(async (method, id) => {
    const key = account.current;
    const result = await cartApi[method](id);
    if (key === account.current) { revision.current++; setCart(result.cart); setLoading(false); setError(""); }
    return result.cart;
  }, []);
  return <CartContext.Provider value={{ cart, loading, error, refresh,
    add: (id) => mutate("add", id), remove: (id) => mutate("remove", id) }}>{children}</CartContext.Provider>;
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart requires CartProvider");
  return value;
}
