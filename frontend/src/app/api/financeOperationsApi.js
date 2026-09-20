import { authFetch } from "../utils/auth/auth.js";

export async function financeRequest(path, method = "GET", data) {
  const response = await authFetch(path, { method, headers: { "Content-Type": "application/json" },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) throw new Error(body.error || "Không thể xử lý yêu cầu.");
  return body;
}
export async function downloadInvoice(path, filename) {
  const response = await authFetch(path, { headers: { Accept: "application/pdf" } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Không tải được hóa đơn.");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
