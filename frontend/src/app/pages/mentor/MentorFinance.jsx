import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  ArrowDownRight,
  History,
  ArrowRight,
  Wallet,
  PieChart as ChartPie,
  Calendar,
  BookOpen,
  CheckCircle2 as CheckCircle,
  Clock,
  Download,
  Filter,
  BadgeCheck,
  CreditCard,
  X,
  Plus
} from "lucide-react";
import { getUser, getDisplayName } from "../../utils/auth";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { fetchMentorFinance, requestMentorPayout, updateMentorPayoutAccount } from "../../utils/mentorApi";
import { toastApiError, toastApiSuccess } from "../../utils/apiToast";
import { AppSelect } from "../../components/ui/AppSelect";

const MENTOR_FINANCE_EXTRA_CSS = `
        .glass-tag {
           padding: 6px 12px;
           border-radius: 10px;
           font-size: 12px;
           font-weight: 800;
           letter-spacing: 0;
        }
        .withdraw-modal-card {
           background: #ffffff;
           border-radius: 16px;
           border: 1px solid rgba(128, 55, 244, 0.14);
           box-shadow:
             0 24px 64px rgba(128, 55, 244, 0.1),
             0 8px 24px rgba(15, 23, 42, 0.06);
           overflow: hidden;
        }
`;

const withdrawFieldLabel =
  "mb-1.5 block text-xs font-semibold text-slate-700";
const withdrawFieldInput =
  "w-full rounded-lg border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#8037f4] focus:bg-[#faf8ff] focus:ring-2 focus:ring-[#8037f4]/12";

const SUPPORTED_BANKS = [
  "Vietcombank",
  "BIDV",
  "VietinBank",
  "Agribank",
  "Techcombank",
  "MB Bank",
  "ACB",
  "VPBank",
  "TPBank",
  "Sacombank",
  "HDBank",
  "VIB",
  "SHB",
  "OCB",
  "Eximbank",
  "SeABank",
  "PVcomBank",
  "Nam A Bank",
];

const BANK_OTHER = "__other__";

function resolveBankFields(savedName) {
  const name = String(savedName || "").trim();
  if (!name) return { select: "", custom: "" };
  if (SUPPORTED_BANKS.includes(name)) return { select: name, custom: "" };
  return { select: BANK_OTHER, custom: name };
}

function isValidBankName(name) {
  const n = String(name || "").trim();
  if (!n || n.length < 2 || n.length > 80) return false;
  if (SUPPORTED_BANKS.includes(n)) return true;
  return /^[\p{L}\p{N}\s.&()-]+$/u.test(n);
}

function percentLabel(rate) {
  const n = Number(rate || 0) * 100;
  if (!Number.isFinite(n)) return "0%";
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

/* ── Withdrawal Modal ────────────────────────────────────────────────── */
function WithdrawalModal({
  balance,
  payoutAccount,
  payoutAccountOwnerName,
  payoutAccountMasked,
  onSavePayoutAccount,
  onSubmit,
  onClose,
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [success, setSuccess] = useState(false);
  const initialBank = resolveBankFields(payoutAccount?.bankName);
  const [bankSelect, setBankSelect] = useState(initialBank.select);
  const [customBankName, setCustomBankName] = useState(initialBank.custom);
  const [accountNumber, setAccountNumber] = useState(payoutAccount?.accountNumber || "");

  useEffect(() => {
    const next = resolveBankFields(payoutAccount?.bankName);
    setBankSelect(next.select);
    setCustomBankName(next.custom);
    setAccountNumber(payoutAccount?.accountNumber || "");
  }, [payoutAccount]);

  const effectiveBankName =
    bankSelect === BANK_OTHER ? customBankName.trim() : bankSelect.trim();

  const amountDigits = String(amount || "").replace(/\D/g, "");
  const amountValue = Number(amountDigits || 0);
  const hasEnoughAmount = amountValue >= 100000;
  const accountDigits = accountNumber.replace(/\D/g, "");
  const isAccountReady =
    isValidBankName(effectiveBankName) &&
    /^\d{8,19}$/.test(accountDigits);
  const isAccountChanged =
    effectiveBankName !== (payoutAccount?.bankName || "").trim() ||
    accountDigits !== (payoutAccount?.accountNumber || "");

  const persistAccount = async () => {
    if (!isAccountReady) return { success: false, error: "Vui lòng nhập đủ thông tin tài khoản nhận tiền." };
    setSavingAccount(true);
    const result = await onSavePayoutAccount?.({
      bankName: effectiveBankName,
      accountNumber: accountDigits,
    });
    setSavingAccount(false);
    return result;
  };

  const handleWithdraw = async () => {
    const n = amountValue;
    if (!Number.isFinite(n) || n < 100000) return;
    if (!isAccountReady) return;
    if (isAccountChanged) {
      const saved = await persistAccount();
      if (!saved?.success) return;
    }
    setLoading(true);
    const res = await onSubmit?.(Math.round(n));
    setLoading(false);
    if (!res?.success) return;
    setSuccess(true);
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.98, y: 12, opacity: 0 }}
        className="withdraw-modal-card my-6 w-full max-w-[28rem] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
          {success ? (
            <div className="space-y-5 p-6 text-center sm:p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#93f72b]/20 ring-4 ring-[#93f72b]/10">
                <CheckCircle size={36} className="text-[#630ed4]" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Yêu cầu đã gửi</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Admin sẽ xử lý và chuyển khoản trong 1–2 ngày làm việc.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-[#8037f4] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6d2fd6]"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-[#630ed4] to-[#8037f4] px-5 py-4 text-white sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                      <Wallet size={20} strokeWidth={2.25} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold leading-tight">Rút tiền</h2>
                      <p className="mt-1 text-sm text-white/85">
                        Số dư khả dụng{" "}
                        <span className="font-bold text-[#93f72b]">
                          {balance.toLocaleString("vi-VN")} Đ
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                    aria-label="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <section className="rounded-xl border border-[#8037f4]/10 bg-[#faf8ff]/70 p-4">
                  <p className="mb-3 text-xs font-normal text-[#630ed4]">Tài khoản nhận tiền</p>
                  <div className="space-y-3">
                    <div>
                      <label className={withdrawFieldLabel}>Ngân hàng</label>
                      <AppSelect
                        size="md"
                        value={bankSelect || undefined}
                        onValueChange={(v) => {
                          setBankSelect(v);
                          if (v !== BANK_OTHER) setCustomBankName("");
                        }}
                        placeholder="Chọn ngân hàng"
                        triggerClassName={withdrawFieldInput}
                        options={[
                          ...SUPPORTED_BANKS.map((bank) => ({ value: bank, label: bank })),
                          { value: BANK_OTHER, label: "Ngân hàng khác…" },
                        ]}
                      />
                      {bankSelect === BANK_OTHER ? (
                        <div className="mt-3">
                          <label className={withdrawFieldLabel}>Tên ngân hàng</label>
                          <input
                            type="text"
                            autoComplete="off"
                            placeholder="VD: MSB, SCB, Liên Việt PostBank"
                            maxLength={80}
                            value={customBankName}
                            onChange={(e) => setCustomBankName(e.target.value)}
                            className={withdrawFieldInput}
                          />
                          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                            Nhập đúng tên ngân hàng trên ứng dụng hoặc thẻ ATM của bạn.
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className={withdrawFieldLabel}>Số tài khoản</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="8–19 chữ số"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                        className={`${withdrawFieldInput} tabular-nums tracking-wide`}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-3 rounded-lg border border-[#8037f4]/12 bg-white px-3 py-2.5">
                    <BadgeCheck size={18} className="mt-0.5 shrink-0 text-[#8037f4]" aria-hidden />
                    <div className="min-w-0 text-xs leading-relaxed text-slate-600">
                      <p className="font-semibold text-slate-900">{payoutAccountOwnerName || "Mentor"}</p>
                      <p className="mt-0.5">
                        Tên theo hồ sơ đã xác minh — STK phải trùng chính chủ.
                        {payoutAccountMasked ? (
                          <span className="text-slate-500"> · Đã lưu {payoutAccountMasked}</span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={persistAccount}
                    disabled={!isAccountReady || savingAccount}
                    className="mt-3 w-full rounded-lg border border-[#8037f4]/25 bg-white py-2 text-sm font-semibold text-[#630ed4] transition-colors hover:bg-[#8037f4]/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingAccount ? "Đang lưu…" : "Lưu tài khoản"}
                  </button>
                </section>

                <section>
                  <label className={withdrawFieldLabel}>Số tiền muốn rút</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="500.000"
                      value={amountDigits ? amountValue.toLocaleString("vi-VN") : ""}
                      onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                      className={`${withdrawFieldInput} py-3 pr-12 text-lg font-bold text-[#630ed4] placeholder:font-medium placeholder:text-slate-400`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-normal text-slate-400">
                      Đ
                    </span>
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span>
                      Rút:{" "}
                      <strong className="font-normal text-slate-800">
                        {amountValue.toLocaleString("vi-VN")} Đ
                      </strong>
                    </span>
                    <span className="hidden text-slate-300 sm:inline">·</span>
                    <span>Tối thiểu 100.000 Đ</span>
                  </p>
                </section>

                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={!hasEnoughAmount || loading || savingAccount || !isAccountReady}
                  className="w-full rounded-lg bg-[#93f72b] py-3.5 text-sm font-bold text-slate-900 shadow-[0_6px_20px_rgba(147,247,43,0.35)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {loading ? "Đang xử lý…" : "Xác nhận gửi yêu cầu"}
                </button>

                {!isAccountReady ? (
                  <p className="text-center text-xs text-amber-700">
                    Chọn hoặc nhập tên ngân hàng và STK hợp lệ (8–19 số) để tiếp tục.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </motion.div>
    </motion.div>,
    document.body,
  );
}

/* ── Main Finance Component ────────────────────────────────────────── */
export function MentorFinance() {
  const navigate = useNavigate();
  const user = getUser();
  const [activeTab, setActiveTab] = useState("all");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [finance, setFinance] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const transactionSectionRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== "mentor") {
      navigate("/");
      return;
    }
    void (async () => {
      try {
        const res = await fetchMentorFinance();
        if (res.success && res.finance) setFinance(res.finance);
        else if (!res.success) toastApiError(res.error, "Không tải được tài chính mentor.");
      } catch {
        toastApiError("Lỗi kết nối khi tải tài chính.");
      }
    })();
  }, [navigate, user?.role]);

  if (!user || user.role !== "mentor") return null;

  const availableBalance = Number(finance?.availableBalance || 0);
  const pendingBalance = Number(finance?.pendingBalance || 0);
  const totalEarned = Number(finance?.totalEarned || 0);
  const bookingIncome = Number(finance?.incomeBreakdown?.booking || 0);
  const courseIncome = Number(finance?.incomeBreakdown?.course || 0);
  const payoutAccount = finance?.payoutAccount || {};
  const payoutAccountMasked = finance?.payoutAccountMasked || "";
  const payoutAccountOwnerName = finance?.payoutAccountOwnerName || getDisplayName(user, "Mentor");
  const transactions = Array.isArray(finance?.history) ? finance.history : [];
  const commissionPolicy = finance?.commissionPolicy || null;
  const totalSessions = Number(finance?.totalSessions ?? 0);
  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === "all") return true;
    if (activeTab === "income") return tx.type === "income";
    return tx.type === "withdraw";
  });
  const openWithdrawHistory = () => {
    setActiveTab("withdraw");
    transactionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const payoutStatusMeta = (status) => {
    const purpleTag =
      "rounded-full border border-[#8037f4] bg-[#8037f4]/12 px-4 py-1.5 font-bold text-[#8037f4]";
    const greenTag =
      "rounded-full border border-[#93f72b] bg-[#93f72b]/12 px-4 py-1.5 font-bold text-[#93f72b]";
    if (status === "paid") {
      return { text: "Đã chuyển khoản", className: greenTag };
    }
    if (status === "approved") {
      return { text: "Đã duyệt — chờ chuyển khoản", className: purpleTag };
    }
    if (status === "completed") {
      return { text: "Hoàn tất", className: greenTag };
    }
    if (status === "failed") {
      return { text: "Từ chối", className: purpleTag };
    }
    return { text: "Đang xử lý", className: purpleTag };
  };
  const txDisplayTitle = (tx) => {
    const raw = String(tx?.description || "").toLowerCase();
    if (tx?.type === "income") {
      if (raw.includes("booking")) return "Thu nhập buổi tư vấn";
      if (raw.includes("khóa học")) return "Thu nhập khóa học";
      return "Thu nhập";
    }
    if (raw.includes("rút tiền")) return "Yêu cầu rút tiền";
    return tx?.description || "Giao dịch";
  };
  return (
    <MentorPageShell bottomPad="pb-32" extraStyles={MENTOR_FINANCE_EXTRA_CSS}>
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-8">

        {/* ── Header ── */}
        <div className="mb-7">
          <p className="mentor-eyebrow mb-1 flex items-center gap-2">
            <Wallet size={12} /> Ví Mentor
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Quản lý <span className="text-[#8037f4]">tài chính</span>
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-600">Theo dõi thu nhập, giao dịch và quản lý dòng tiền của bạn.</p>
        </div>

        {/* ── Wallet Cards ── */}
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-12">

          {/* Primary balance */}
          <div className="relative lg:col-span-7 overflow-hidden rounded-2xl bg-gradient-to-br from-[#8037f4] to-[#630ed4] p-6 text-white shadow-lg shadow-[#8037f4]/20">
            <div className="absolute -right-6 -top-6 opacity-10">
              <Wallet size={120} />
            </div>
            <div className="relative z-10">
              <p className="mentor-label mentor-label--on-dark mb-1">Số dư khả dụng</p>
              <div className="mb-5 flex items-baseline gap-2">
                <h2 className="mentor-stat-num mentor-stat-num--hero mentor-stat-num--on-dark">{availableBalance.toLocaleString("vi-VN")}</h2>
                <span className="text-lg font-bold text-white/60">Đ</span>
              </div>
              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="flex items-center gap-2 rounded-xl bg-[#93f72b] px-5 py-2.5 text-sm font-bold text-slate-900 shadow-[0_8px_20px_rgba(147,247,43,0.35)] transition hover:brightness-105 active:scale-95"
                >
                  <CreditCard size={15} /> Rút tiền ngay
                </button>
                <button
                  onClick={openWithdrawHistory}
                  className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
                >
                  <History size={15} /> Xem lịch sử rút
                </button>
              </div>

              {/* Breakdown sub-row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="mentor-label mentor-label--on-dark">Từ đặt lịch</p>
                    <Calendar size={13} className="text-white/50" />
                  </div>
                  <p className="mentor-stat-num mentor-stat-num--card mentor-stat-num--on-dark">{bookingIncome.toLocaleString("vi-VN")} Đ</p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="mentor-label mentor-label--on-dark">Từ khóa học</p>
                    <BookOpen size={13} className="text-white/50" />
                  </div>
                  <p className="mentor-stat-num mentor-stat-num--card mentor-stat-num--on-dark">{courseIncome.toLocaleString("vi-VN")} Đ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-5">

            {/* Chờ giải ngân — dark */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-6 py-5 shadow-sm">
              <div>
                <p className="mentor-label mentor-label--on-dark mb-1">Chờ giải ngân</p>
                <p className="mentor-stat-num mentor-stat-num--hero mentor-stat-num--on-dark">{pendingBalance.toLocaleString("vi-VN")} Đ</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">Dự kiến sau 7 ngày</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Clock size={22} className="text-[#93f72b]" />
              </div>
            </div>

            {/* Tổng thu nhập — lime */}
            <div className="flex items-center justify-between rounded-2xl bg-[#c4ff47] px-6 py-5 shadow-sm">
              <div>
                <p className="mentor-label mb-1">Tổng thu nhập</p>
                <p className="mentor-stat-num mentor-stat-num--hero">{totalEarned.toLocaleString("vi-VN")} Đ</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">Tổng cộng từ đặt lịch và khóa học (sau phí nền tảng).</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/10">
                <ChartPie size={22} className="text-slate-800" />
              </div>
            </div>

            {/* Commission policy */}
            {commissionPolicy ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="mentor-label mb-3">Chính sách phí hiện tại</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Booking</p>
                      {commissionPolicy.bookingRateSource === "mentor_custom" && (
                        <p className="text-[11px] font-semibold text-violet-600">Mức riêng theo hợp đồng</p>
                      )}
                    </div>
                    <span className="rounded-lg bg-[#93f72b] px-3 py-1 text-xs font-bold text-slate-900">
                      {percentLabel(commissionPolicy.bookingRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Khóa học</p>
                      {commissionPolicy.courseRateSource === "mentor_custom" && (
                        <p className="text-[11px] font-semibold text-violet-600">Mức riêng theo hợp đồng</p>
                      )}
                    </div>
                    <span className="rounded-lg bg-[#93f72b] px-3 py-1 text-xs font-bold text-slate-900">
                      {percentLabel(commissionPolicy.courseRate)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-medium text-slate-500">
                  {commissionPolicy.isEarlyMentorActive && commissionPolicy.earlyMentorExpiresAt
                    ? `Ưu đãi Early Mentor đến ${new Date(commissionPolicy.earlyMentorExpiresAt).toLocaleDateString("vi-VN")}`
                    : `Mức phí tiêu chuẩn${commissionPolicy.isEarlyMentor && commissionPolicy.earlyMentorExpiresAt ? ` (Early Mentor kết thúc ${new Date(commissionPolicy.earlyMentorExpiresAt).toLocaleDateString("vi-VN")})` : ""}`}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Transaction History ── */}
        <div ref={transactionSectionRef} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {/* Table header */}
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8037f4]/10">
                <History size={18} className="text-[#8037f4]" />
              </div>
              <div>
                <p className="text-base font-black tracking-tight text-slate-900">Lịch sử giao dịch</p>
                <p className="text-xs font-bold text-slate-700">Danh sách các khoản thu và lệnh rút tiền</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {["all", "income", "withdraw"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs transition-all ${
                    activeTab === t
                      ? "bg-[#8037f4] font-black text-white shadow-sm"
                      : "border border-slate-200 bg-white font-bold text-slate-800 hover:border-[#8037f4]/40 hover:text-[#8037f4]"
                  }`}
                >
                  {t === "all" ? "Tất cả" : t === "income" ? "Thu nhập" : "Rút tiền"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  <th className="px-6 py-3 text-left">Giao dịch</th>
                  <th className="px-6 py-3 text-left">Ngày tháng</th>
                  <th className="px-6 py-3 text-left">Số tiền</th>
                  <th className="px-6 py-3 text-left">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          tx.type === "income"
                            ? "bg-[#93f72b]/20 text-[#8037f4]"
                            : "bg-[#8037f4]/10 text-[#8037f4]"
                        }`}>
                          {tx.type === "income"
                            ? <ArrowUpRight size={16} strokeWidth={2.5} />
                            : <ArrowDownRight size={16} strokeWidth={2.5} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{txDisplayTitle(tx)}</p>
                          <p className="text-[11px] font-semibold text-slate-600">Mã: {tx.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{new Date(tx.date).toLocaleDateString("vi-VN")}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`mentor-money-num text-base ${tx.type === "income" ? "text-[#8037f4]" : "text-slate-900"}`}>
                        {tx.type === "income" ? "+" : "-"}{Number(tx.amount || 0).toLocaleString("vi-VN")} Đ
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`glass-tag ${payoutStatusMeta(tx.status).className}`}>
                        {payoutStatusMeta(tx.status).text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-[#8037f4]/30 hover:text-[#8037f4]"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredTransactions.length && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-slate-500">
                      Không có giao dịch phù hợp bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showWithdraw && (
          <WithdrawalModal
            balance={availableBalance}
            payoutAccount={payoutAccount}
            payoutAccountOwnerName={payoutAccountOwnerName}
            payoutAccountMasked={payoutAccountMasked}
            onSavePayoutAccount={async (account) => {
              try {
              const res = await updateMentorPayoutAccount(account);
              if (!res.success) {
                toastApiError(res.error, "Không lưu được tài khoản nhận tiền.");
                return { success: false };
              }
              setFinance((prev) => ({
                ...(prev || {}),
                payoutAccount: res.payoutAccount || account,
              }));
              toastApiSuccess("Đã lưu tài khoản nhận tiền.");
              return { success: true };
              } catch {
                toastApiError("Lỗi kết nối khi lưu tài khoản nhận tiền.");
                return { success: false };
              }
            }}
            onSubmit={async (amount) => {
              try {
              const res = await requestMentorPayout(amount);
              if (!res.success) {
                toastApiError(res.error, "Không gửi được yêu cầu rút tiền.");
                return { success: false };
              }
              toastApiSuccess("Đã gửi yêu cầu rút tiền.");
              const optimisticRow = {
                id: res.payout?.id || `local-${Date.now()}`,
                type: "withdraw",
                amount: Number(amount || 0),
                status: "pending",
                date: new Date().toISOString(),
                description: "Yêu cầu rút tiền",
              };
              setFinance((prev) => ({
                ...(prev || {}),
                availableBalance: Math.max(0, Number(prev?.availableBalance || 0) - Number(amount || 0)),
                pendingBalance: Number(prev?.pendingBalance || 0) + Number(amount || 0),
                history: [optimisticRow, ...(Array.isArray(prev?.history) ? prev.history : [])],
              }));
              const refreshed = await fetchMentorFinance();
              if (refreshed.success && refreshed.finance) setFinance(refreshed.finance);
              return { success: true };
              } catch {
                toastApiError("Lỗi kết nối khi gửi yêu cầu rút tiền.");
                return { success: false };
              }
            }}
            onClose={() => setShowWithdraw(false)}
          />
        )}
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-[#8037f4]/20 bg-white p-8 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-3">
                <h3 className="text-2xl font-bold text-[#630ed4]">Chi tiết giao dịch</h3>
                <span className={`glass-tag ${payoutStatusMeta(selectedTx.status).className}`}>
                  {payoutStatusMeta(selectedTx.status).text}
                </span>
              </div>

              <div className="mb-5 rounded-2xl border border-[#8037f4]/20 bg-[#8037f4]/5 px-5 py-4">
                <p className="mb-2 text-sm font-semibold text-[#8037f4]">Số tiền giao dịch</p>
                <p
                  className={`mentor-money-num text-xl sm:text-2xl ${
                    selectedTx.type === "income" ? "text-[#630ed4]" : "text-slate-900"
                  }`}
                >
                  {selectedTx.type === "income" ? "+" : "-"}
                  {Number(selectedTx.amount || 0).toLocaleString("vi-VN")} Đ
                </p>
              </div>

              <div className="space-y-3 text-sm font-medium">
                <p className="text-slate-900">
                  <span className="font-bold text-[#8037f4]">Mã giao dịch:</span> {selectedTx.id}
                </p>
                <p className="text-slate-900">
                  <span className="font-bold text-[#8037f4]">Loại:</span>{" "}
                  {selectedTx.type === "income" ? "Thu nhập" : "Rút tiền"}
                </p>
                <p className="text-slate-900">
                  <span className="font-bold text-[#8037f4]">Mô tả:</span> {txDisplayTitle(selectedTx)}
                </p>
                <p className="text-slate-900">
                  <span className="font-bold text-[#8037f4]">Thời gian:</span>{" "}
                  {new Date(selectedTx.date).toLocaleString("vi-VN")}
                </p>
                {selectedTx.reviewedAt ? (
                  <p className="text-slate-900">
                    <span className="font-bold text-[#8037f4]">Thời gian xử lý:</span>{" "}
                    {new Date(selectedTx.reviewedAt).toLocaleString("vi-VN")}
                  </p>
                ) : null}
                {selectedTx.paidAt ? (
                  <p className="text-slate-900">
                    <span className="font-bold text-[#8037f4]">Thời điểm đã chi:</span>{" "}
                    {new Date(selectedTx.paidAt).toLocaleString("vi-VN")}
                  </p>
                ) : null}
                {selectedTx.transferRef ? (
                  <p className="text-slate-900">
                    <span className="font-bold text-[#8037f4]">Tham chiếu chuyển khoản:</span> {selectedTx.transferRef}
                  </p>
                ) : null}
                {selectedTx.providerRef ? (
                  <p className="text-slate-900">
                    <span className="font-bold text-[#8037f4]">Mã tham chiếu:</span> {selectedTx.providerRef}
                  </p>
                ) : null}
                {selectedTx.rejectReason ? (
                  <div className="rounded-xl border border-[#8037f4]/25 bg-[#8037f4]/8 p-3">
                    <p className="text-sm font-bold text-[#630ed4]">Lý do từ chối</p>
                    <p className="mt-1 text-sm text-slate-800">{selectedTx.rejectReason}</p>
                  </div>
                ) : null}
                {selectedTx.note ? (
                  <div className="rounded-xl border border-[#93f72b]/35 bg-[#93f72b]/15 p-3">
                    <p className="text-sm font-bold text-[#630ed4]">Ghi chú xử lý</p>
                    <p className="mt-1 text-sm text-slate-800">{selectedTx.note}</p>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="mt-8 w-full rounded-xl bg-[#93f72b] py-3 text-sm font-bold text-[#120B2E] shadow-[0_8px_24px_rgba(147,247,43,0.35)] transition hover:brightness-105"
              >
                Đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MentorPageShell>
  );
}
