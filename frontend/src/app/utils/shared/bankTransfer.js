export const BANK_TRANSFER = {
  bankName: import.meta.env.VITE_BANK_TRANSFER_NAME || "",
  accountNumber: import.meta.env.VITE_BANK_TRANSFER_ACCOUNT || "",
  accountOwner: import.meta.env.VITE_BANK_TRANSFER_OWNER || "",
};
export function displayBankName(raw) {
  const explicit = String(import.meta.env.VITE_BANK_TRANSFER_DISPLAY_NAME || "").trim();
  if (explicit) return explicit;
  return String(raw || "").replace(/\bTMCP\b/gi, "Thương mại Cổ phần")
    .replace(/\s*\(?\s*TPBank\s*\)?\s*/gi, " ").replace(/\s{2,}/g, " ").trim();
}
export function inferVietQrBankId() {
  const explicit = import.meta.env.VITE_VIETQR_BANK_ID;
  if (explicit && String(explicit).trim()) return String(explicit).trim().toUpperCase();
  const name = BANK_TRANSFER.bankName.toLowerCase();
  return ["tiên phong", "tien phong", "tpbank", "tp bank"].some((part) => name.includes(part)) ? "TPB" : "";
}
export function buildVietQrImageUrl(bankId, accountDigits, amountVnd, addInfo) {
  const bid = String(bankId || "").trim().toUpperCase();
  const acc = String(accountDigits || "").replace(/\D/g, "");
  const amt = Math.round(Number(amountVnd) || 0);
  if (!bid || !acc || amt <= 0) return null;
  return `https://img.vietqr.io/image/${bid}-${acc}-compact2.png?amount=${amt}&addInfo=${encodeURIComponent(String(addInfo || "").slice(0, 50))}`;
}
