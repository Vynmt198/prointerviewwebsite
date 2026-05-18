/**
 * Backend gốc — không có dấu / cuối.
 * - Dev: không set VITE_API_URL → gọi trực tiếp http://localhost:5000
 * - Prod build: không set VITE_API_URL → "" (cùng origin)
 * - Prod: set VITE_API_URL=https://api.example.com
 */
function resolveApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL;

  if (fromEnv != null && String(fromEnv).trim() !== "") {
    return String(fromEnv).replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }

  return "";
}

export const API_BASE_URL = resolveApiBase();

/** True khi FE có URL backend khả dụng */
export function isExpressBackendConfigured() {
  return Boolean(API_BASE_URL && String(API_BASE_URL).trim());
}

/**
 * URL đầy đủ cho một path API (path bắt đầu bằng /).
 * Ví dụ: apiUrl("/api/mentors")
 * → http://localhost:5000/api/mentors
 */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

export async function apiGet(path) {
  const response = await fetch(apiUrl(path), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}