import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  CircleDollarSign as CurrencyCircleDollar,
  ArrowUpRight,
  ArrowDownRight,
  History,
  ArrowRight,
  Wallet,
  PieChart as ChartPie,
  Calendar,
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

const MENTOR_FINANCE_EXTRA_CSS = `
        .glass-tag {
           padding: 6px 12px;
           border-radius: 10px;
           font-size: 12px;
           font-weight: 600;
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
  "mb-1.5 block text-xs font-semibold text-slate-600";
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
                          {balance.toLocaleString("vi-VN")} ₫
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
                  <p className="mb-3 text-xs font-semibold text-[#630ed4]">Tài khoản nhận tiền</p>
                  <div className="space-y-3">
                    <div>
                      <label className={withdrawFieldLabel}>Ngân hàng</label>
                      <select
                        value={bankSelect}
                        onChange={(e) => {
                          setBankSelect(e.target.value);
                          if (e.target.value !== BANK_OTHER) setCustomBankName("");
                        }}
                        className={withdrawFieldInput}
                      >
                        <option value="">Chọn ngân hàng</option>
                        {SUPPORTED_BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                        <option value={BANK_OTHER}>Ngân hàng khác…</option>
                      </select>
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
                        className={`${withdrawFieldInput} font-mono tracking-wide`}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-3 rounded-lg border border-[#8037f4]/12 bg-white px-3 py-2.5">
                    <BadgeCheck size={18} className="mt-0.5 shrink-0 text-[#8037f4]" aria-hidden />
                    <div className="min-w-0 text-xs leading-relaxed text-slate-600">
                      <p className="font-semibold text-slate-900">{payoutAccountOwnerName || "Mentor"}</p>
                      <p className="mt-0.5">
                        Tên theo hồ sơ đã xác minh, STK phải trùng chính chủ.
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
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      ₫
                    </span>
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span>
                      Rút:{" "}
                      <strong className="font-semibold text-slate-800">
                        {amountValue.toLocaleString("vi-VN")} ₫
                      </strong>
                    </span>
                    <span className="hidden text-slate-300 sm:inline">·</span>
                    <span>Tối thiểu 100.000 ₫</span>
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
  const payoutAccount = finance?.payoutAccount || {};
  const payoutAccountMasked = finance?.payoutAccountMasked || "";
  const payoutAccountOwnerName = finance?.payoutAccountOwnerName || getDisplayName(user, "Mentor");
  const transactions = Array.isArray(finance?.history) ? finance.history : [];
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
    if (status === "paid") {
      return {
        text: "Đã chuyển khoản",
        className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      };
    }
    if (status === "approved") {
      return {
        text: "Đã duyệt, chờ chuyển khoản",
        className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      };
    }
    if (status === "completed") {
      return {
        text: "Hoàn tất",
        className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      };
    }
    if (status === "failed") {
      return {
        text: "Từ chối",
        className: "bg-red-500/10 text-red-400 border border-red-500/20",
      };
    }
    return {
      text: "Đang xử lý",
      className: "bg-orange-400/10 text-orange-400 border border-orange-400/20",
    };
  };

  return (
    <MentorPageShell bottomPad="pb-32" extraStyles={MENTOR_FINANCE_EXTRA_CSS}>
      <div className="relative z-10 mx-auto max-w-7xl px-10 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
          <div>
            <h1 className="mb-3 font-headline overflow-visible pb-0.5 text-2xl font-black uppercase leading-[1.2] tracking-tight text-slate-900 sm:text-3xl">
               Quản lý <span className="text-secondary">tài chính</span>
            </h1>
            <p className="text-slate-600 text-sm font-medium">Theo dõi thu nhập, giao dịch và quản lý dòng tiền của bạn</p>
          </div>
        </div>

        {/* Main Wallet Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
           {/* Primary Balance */}
           <div className="lg:col-span-7 glass-card p-12 bg-gradient-to-br from-[#8037f4]/20 to-transparent overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 rotate-12 opacity-10 group-hover:rotate-0 transition-all duration-700">
                 <Wallet size={160} className="text-[#8037f4]" />
              </div>
              <div className="relative z-10">
                 <p className="mb-2 text-sm font-semibold text-violet-700">Số dư khả dụng</p>
                 <div className="flex items-baseline gap-4 mb-10">
                    <h2 className="text-xl font-bold sm:text-2xl tracking-tight text-slate-900 sm:text-4xl">{availableBalance.toLocaleString()}</h2>
                    <p className="text-lg font-semibold text-zinc-500 mb-1">₫</p>
                 </div>
                 <div className="flex flex-wrap gap-4">
                    <button 
                       onClick={() => setShowWithdraw(true)}
                       className="px-10 py-5 rounded-3xl bg-primary-fixed text-black text-sm font-semibold hover:scale-105 transition-all shadow-[0_15px_40px_rgba(196, 255, 71,0.32)]">
                       Rút tiền ngay
                    </button>
                    <button
                       onClick={openWithdrawHistory}
                       className="px-10 py-5 rounded-3xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                    >
                       Xem lịch sử rút
                    </button>
                 </div>
              </div>
           </div>

           {/* Secondary Stats Group */}
           <div className="lg:col-span-5 grid grid-cols-1 gap-8">
              <div className="glass-card p-10 flex items-center justify-between border-t border-t-secondary/20">
                 <div>
                    <p className="mb-1 text-sm font-semibold text-zinc-500">Chờ giải ngân</p>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{pendingBalance.toLocaleString()} ₫</h3>
                    <p className="mt-2 text-xs text-zinc-600">Dự kiến sau 7 ngày</p>
                 </div>
                 <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <Clock size={28} />
                 </div>
              </div>

              <div className="glass-card p-10 flex items-center justify-between">
                 <div>
                    <p className="mb-1 text-sm font-semibold text-zinc-500">Tổng thu nhập</p>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{totalEarned.toLocaleString()} ₫</h3>
                    <p className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
                       <ArrowUpRight size={14} className="text-violet-700" />
                       {totalSessions > 0
                         ? `Theo ${totalSessions} buổi đã hoàn thành + học phí khóa (sau phí nền tảng)`
                         : "Tổng giá trị buổi hoàn thành & khóa học (sau phí nền tảng)"}
                    </p>
                 </div>
                 <div className="w-14 h-14 rounded-2xl bg-primary-fixed/10 flex items-center justify-center text-violet-700">
                    <ChartPie size={28} />
                 </div>
              </div>
           </div>
        </div>

        {/* Transaction History */}
        <div ref={transactionSectionRef} className="glass-card overflow-hidden">
           <div className="p-10 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white/[0.01]">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-secondary">
                    <History size={22} />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold text-slate-900 tracking-tight">Lịch sử giao dịch</h4>
                    <p className="text-sm text-zinc-600">Danh sách các khoản thu và lệnh rút tiền</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 {["all", "income", "withdraw"].map(t => (
                    <button key={t} className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all ${activeTab === t ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-50 text-zinc-500 hover:text-slate-900'}`} onClick={() => setActiveTab(t)}>
                       {t === 'all' ? 'Tất cả' : t === 'income' ? 'Thu nhập' : 'Rút tiền'}
                    </button>
                 ))}
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full">
                 <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-zinc-500">
                       <th className="px-10 py-6 text-left">Giao dịch</th>
                       <th className="px-10 py-6 text-left">Ngày tháng</th>
                       <th className="px-10 py-6 text-left">Số tiền</th>
                       <th className="px-10 py-6 text-left">Trạng thái</th>
                       <th className="px-10 py-6 text-right">Chi tiết</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {filteredTransactions.map((tx, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors group">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-primary-fixed/10 text-violet-700' : 'bg-orange-500/10 text-orange-400'}`}>
                                  {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                               </div>
                               <div>
                                  <p className="text-sm font-semibold text-slate-900">{tx.description}</p>
                                  <p className="text-xs text-zinc-500">Mã: {tx.id}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <p className="text-xs font-black text-slate-900">{new Date(tx.date).toLocaleDateString("vi-VN")}</p>
                         </td>
                         <td className="px-10 py-8">
                            <p className={`text-sm font-black tracking-tight ${tx.type === 'income' ? 'text-violet-700' : 'text-slate-700'}`}>
                               {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} ₫
                            </p>
                         </td>
                         <td className="px-10 py-8">
                            <div className="flex">
                               <span className={`glass-tag ${payoutStatusMeta(tx.status).className}`}>
                                  {payoutStatusMeta(tx.status).text}
                               </span>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <button
                               onClick={() => setSelectedTx(tx)}
                               className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-zinc-600 hover:text-slate-900 transition-all ml-auto"
                            >
                               <ArrowRight size={16} />
                            </button>
                         </td>
                      </tr>
                    ))}
                    {!filteredTransactions.length && (
                      <tr>
                        <td colSpan={5} className="px-10 py-10 text-center text-sm text-zinc-500">
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
              className="glass-card w-full max-w-lg p-8 border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Chi tiết giao dịch</h3>
                <span
                  className={`glass-tag ${payoutStatusMeta(selectedTx.status).className}`}
                >
                  {payoutStatusMeta(selectedTx.status).text}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 mb-5">
                <p className="mb-2 text-sm font-semibold text-zinc-500">Số tiền giao dịch</p>
                <p
                  className={`text-xl font-black sm:text-2xl tracking-tight ${
                    selectedTx.type === "income" ? "text-violet-700" : "text-orange-300"
                  }`}
                >
                  {selectedTx.type === "income" ? "+" : "-"}
                  {selectedTx.amount.toLocaleString()} ₫
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-zinc-300"><span className="text-zinc-500">Mã giao dịch:</span> {selectedTx.id}</p>
                <p className="text-zinc-300"><span className="text-zinc-500">Loại:</span> {selectedTx.type === "income" ? "Thu nhập" : "Rút tiền"}</p>
                <p className="text-zinc-300"><span className="text-zinc-500">Mô tả:</span> {selectedTx.description}</p>
                <p className="text-zinc-300"><span className="text-zinc-500">Thời gian:</span> {new Date(selectedTx.date).toLocaleString("vi-VN")}</p>
                {selectedTx.reviewedAt ? (
                  <p className="text-zinc-300">
                    <span className="text-zinc-500">Thời gian xử lý:</span> {new Date(selectedTx.reviewedAt).toLocaleString("vi-VN")}
                  </p>
                ) : null}
                {selectedTx.paidAt ? (
                  <p className="text-zinc-300">
                    <span className="text-zinc-500">Thời điểm đã chi:</span>{" "}
                    {new Date(selectedTx.paidAt).toLocaleString("vi-VN")}
                  </p>
                ) : null}
                {selectedTx.transferRef ? (
                  <p className="text-zinc-300">
                    <span className="text-zinc-500">Tham chiếu chuyển khoản:</span> {selectedTx.transferRef}
                  </p>
                ) : null}
                {selectedTx.providerRef ? (
                  <p className="text-zinc-300"><span className="text-zinc-500">Mã tham chiếu:</span> {selectedTx.providerRef}</p>
                ) : null}
                {selectedTx.rejectReason ? (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3">
                    <p className="text-sm font-semibold text-red-700">Lý do từ chối</p>
                    <p className="mt-1 text-sm text-red-100">{selectedTx.rejectReason}</p>
                  </div>
                ) : null}
                {selectedTx.note ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-zinc-600">Ghi chú xử lý</p>
                    <p className="mt-1 text-sm text-zinc-200">{selectedTx.note}</p>
                  </div>
                ) : null}
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="mt-8 w-full rounded-xl bg-white py-3 text-sm font-semibold text-slate-900 shadow-xl"
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
