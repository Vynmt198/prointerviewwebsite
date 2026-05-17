import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Sparkles as Sparkle,
  Sparkles,
  Check,
  CheckCircle2,
  Lock,
  ShieldCheck,
  AlertCircle,
  Tag,
  Phone,
  Copy,
  Calendar,
  Clock,
  Video,
  Users,
  BookOpen,
  Landmark,
} from "lucide-react";
import { isLoggedIn } from "../../utils/auth";
import { fetchMentor } from "../../utils/mentorApi";
import { genMeetLink } from "../../utils/bookings";
import { createBooking, fetchRebookCredit, submitBookingTransferReference } from "../../utils/bookingsApi";
import { fetchCourseById } from "../../utils/courseApi";
import { enrollmentApi } from "../../utils/enrollmentApi";

/* ─── Plan meta ─────────────────────────────────────────── */

const PLANS = {
  starterPro: {
    name: "Pro",
    tagline: "Luyện tập nghiêm túc",
    monthlyPrice: 79000,
    yearlyPrice: 63000,
    badge: "PHỔ BIẾN",
    accentColor: "#6E35E8",
    features: ["10 buổi AI phỏng vấn/tháng", "AI nhận dạng giọng nói", "20 lần phân tích CV/JD/tháng", "Phản hồi chi tiết từng câu", "Xuất kết quả PDF"],
  },
  elitePro: {
    name: "Elite",
    tagline: "Chinh phục mọi vòng phỏng vấn",
    monthlyPrice: 99000,
    yearlyPrice: 79000,
    badge: "TỐT NHẤT",
    accentColor: "#c4ff47",
    features: ["AI phỏng vấn không giới hạn", "AI nhận dạng giọng nói — Turbo 2×", "CV/JD phân tích không giới hạn", "Phân tích hành vi: Giao tiếp mắt, Tư thế", "Phân tích giọng nói: Tốc độ, Từ đệm", "Mentor 1:1 ưu tiên"],
  },
};

function fmt(n) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function mentorIdsMatch(a, b) {
  const na = String(a || "").trim().toLowerCase();
  const nb = String(b || "").trim().toLowerCase();
  if (!na || !nb) return false;
  if (na === nb) return true;
  const core = (x) => (x.startsWith("u") ? x.slice(1) : x);
  return core(na) === core(nb);
}

/** Hiển thị trên checkout CK — Vite: .env / .env.local (dev) hoặc env trên host build (Vercel) + redeploy. */
const BANK_TRANSFER = {
  bankName: import.meta.env.VITE_BANK_TRANSFER_NAME || "",
  accountNumber: import.meta.env.VITE_BANK_TRANSFER_ACCOUNT || "",
  accountOwner: import.meta.env.VITE_BANK_TRANSFER_OWNER || "",
};

/** Mã ngân hàng cho VietQR (img.vietqr.io). VD: TPB = TPBank, VCB = Vietcombank. */
function inferVietQrBankId() {
  const explicit = import.meta.env.VITE_VIETQR_BANK_ID;
  if (explicit && String(explicit).trim()) return String(explicit).trim().toUpperCase();
  const name = (BANK_TRANSFER.bankName || "").toLowerCase();
  if (
    name.includes("tiên phong") ||
    name.includes("tien phong") ||
    name.includes("tpbank") ||
    name.includes("tp bank")
  ) {
    return "TPB";
  }
  return "";
}

/** Ảnh QR VietQR: quét trong app NH — thường điền sẵn STK, số tiền, nội dung. */
function buildVietQrImageUrl(bankId, accountDigits, amountVnd, addInfo) {
  const bid = String(bankId || "").trim().toUpperCase();
  const acc = String(accountDigits || "").replace(/\D/g, "");
  const amt = Math.round(Number(amountVnd) || 0);
  if (!bid || !acc || amt <= 0) return null;
  const add = encodeURIComponent(String(addInfo || "").slice(0, 50));
  return `https://img.vietqr.io/image/${bid}-${acc}-compact2.png?amount=${amt}&addInfo=${add}`;
}

function extractOrderPart(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  return s.split("|")[0].trim();
}

/* ─── CopyBtn ────────────────────────────────────────────── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all"
      style={{ background: copied ? "rgba(16,185,129,0.1)" : "#F3F4F6", color: copied ? "#10b981" : "#6B7280" }}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Đã sao chép" : "Sao chép"}
    </button>
  );
}

/* ─── Step indicator ─────────────────────────────────────── */
const STEPS_BOOKING = ["THÔNG TIN", "THANH TOÁN", "XÁC NHẬN"];
const STEPS_REBOOK = ["TÓM TẮT", "XÁC NHẬN"];

function StepBar({ current, steps = STEPS_BOOKING }) {
  return (
    <div className="flex items-center justify-center mb-12">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-3">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                  done 
                    ? "bg-secondary text-white shadow-secondary/20" 
                    : active 
                    ? "bg-primary-fixed text-on-primary-fixed shadow-primary-fixed/20 scale-110" 
                    : "bg-white/5 text-white/20 border border-white/5"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : active ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                   <span className="text-[10px] font-black">{i + 1}</span>
                )}
              </div>
              {/* Label */}
              <span
                className={`text-[10px] font-black tracking-[0.2em] uppercase transition-colors duration-500 ${
                  done || active ? "text-primary-fixed" : "text-white/20"
                }`}
              >
                {label}
              </span>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={`h-px mx-6 mb-8 w-12 md:w-20 rounded-full transition-all duration-700 ${
                  i < current ? "bg-gradient-to-r from-secondary to-primary-fixed" : "bg-white/5"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const PAY_MODE = {
  BANK: "bank",
  REBOOK_LOADING: "rebook_loading",
  REBOOK_READY: "rebook_ready",
  REBOOK_SAME: "rebook_same",
  REBOOK_LOW: "rebook_low",
};

function resolvePayMode(ctx) {
  const { isBooking, rebookFrom, rebookCreditLoading, canUseRebookCredit, rebookSameMentor, rebookCreditTooLow } = ctx;
  if (!isBooking || !rebookFrom) return PAY_MODE.BANK;
  if (rebookCreditLoading) return PAY_MODE.REBOOK_LOADING;
  if (rebookSameMentor) return PAY_MODE.REBOOK_SAME;
  if (rebookCreditTooLow) return PAY_MODE.REBOOK_LOW;
  if (canUseRebookCredit) return PAY_MODE.REBOOK_READY;
  return PAY_MODE.BANK;
}

const PAY_HEADING = {
  [PAY_MODE.BANK]: "Thanh toán chuyển khoản",
  [PAY_MODE.REBOOK_READY]: "Xác nhận đặt lại",
  [PAY_MODE.REBOOK_LOADING]: "Đổi mentor",
  [PAY_MODE.REBOOK_SAME]: "Cần mentor khác",
  [PAY_MODE.REBOOK_LOW]: "Credit chưa đủ",
};

function CheckoutPayPanel({ mode, fmt, rebookCreditVnd, bookingTotalEstimate, bookingMentor, rebookFrom, navigate }) {
  if (mode === PAY_MODE.REBOOK_LOADING) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-primary-fixed" />
        Đang kiểm tra credit…
      </div>
    );
  }
  if (mode === PAY_MODE.REBOOK_READY) {
    return (
      <div className="mb-6 rounded-2xl border border-violet-400/35 bg-violet-500/10 px-4 py-4 text-xs text-violet-100/90 leading-relaxed">
        Dùng <strong className="text-white">{fmt(rebookCreditVnd)}</strong> đã trả cho buổi mới{" "}
        <strong className="text-white">{fmt(bookingTotalEstimate)}</strong>. Bấm xác nhận — không CK lại.
      </div>
    );
  }
  if (mode === PAY_MODE.REBOOK_SAME) {
    return (
      <div className="mb-6 space-y-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-4 text-xs text-amber-100/90">
        <p>
          Credit chỉ khi đặt <strong className="text-white">mentor khác</strong>
          {bookingMentor?.name ? ` (không phải ${bookingMentor.name})` : ""}. Giữ mentor này → buổi cũ → «Đổi lịch».
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/mentors?rebookFrom=${encodeURIComponent(rebookFrom)}`)}
            className="rounded-lg bg-[#c4ff47] px-3 py-2 text-[10px] font-black uppercase text-black"
          >
            Mentor khác
          </button>
          <button
            type="button"
            onClick={() => navigate(`/session/${encodeURIComponent(rebookFrom)}`)}
            className="rounded-lg border border-white/25 px-3 py-2 text-[10px] font-black uppercase text-white"
          >
            Đổi lịch (buổi cũ)
          </button>
        </div>
      </div>
    );
  }
  if (mode === PAY_MODE.REBOOK_LOW) {
    return (
      <div className="mb-6 space-y-3 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-4 text-xs text-red-100/90">
        <p>
          Credit {fmt(rebookCreditVnd)} — buổi {fmt(bookingTotalEstimate)} (thiếu{" "}
          {fmt(bookingTotalEstimate - rebookCreditVnd)}).
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/mentors?rebookFrom=${encodeURIComponent(rebookFrom)}`)}
            className="rounded-lg bg-[#6E35E8] px-3 py-2 text-[10px] font-black uppercase text-white"
          >
            Mentor khác
          </button>
          <button
            type="button"
            onClick={() => navigate(`/session/${encodeURIComponent(rebookFrom)}`)}
            className="rounded-lg border border-white/25 px-3 py-2 text-[10px] font-black uppercase text-white"
          >
            Buổi cũ
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-6 flex gap-4 rounded-2xl border border-primary-fixed/30 bg-primary-fixed/[0.06] p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-black">
        <Landmark className="h-6 w-6" />
      </div>
      <p className="text-xs leading-relaxed text-white/60">
        Tiếp theo: STK + QR VietQR → chuyển khoản → «Đã chuyển» → admin kích hoạt lịch.
      </p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */

export function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  /* ── Booking / Course / Plan mode ─────────────────────────────── */
  const isBooking = searchParams.get("type") === "booking";
  const isCourse = searchParams.get("type") === "course";
  const courseId = searchParams.get("courseId") ?? "";
  const isPaidCheckout = isBooking || isCourse;
  const mentorId = searchParams.get("mentorId") ?? "";
  const [bookingMentor, setBookingMentor] = React.useState(null);
  const [courseInfo, setCourseInfo] = React.useState(null);

  React.useEffect(() => {
    if (!isBooking || !mentorId) {
      setBookingMentor(null);
      return;
    }
    setBookingMentor(null);
    void fetchMentor(mentorId).then((m) => {
      if (m) setBookingMentor(m);
    });
  }, [isBooking, mentorId]);

  React.useEffect(() => {
    if (!isCourse || !courseId) {
      setCourseInfo(null);
      return;
    }
    setCourseInfo(null);
    void fetchCourseById(courseId).then((r) => {
      if (r.success && r.course) setCourseInfo(r.course);
    });
  }, [isCourse, courseId]);

  const bookingPrice = Number(bookingMentor?.price ?? searchParams.get("price") ?? 0);
  const bookingDate = searchParams.get("date") ?? "";
  const bookingTime = searchParams.get("time") ?? "";

  /* ── Plan mode ────────────────────────────────────────── */
  const planKey = searchParams.get("plan") ?? "starterPro";
  const billing = (searchParams.get("billing") ?? "yearly");
  const plan = PLANS[planKey] ?? PLANS.starterPro;
  // Read the exact price shown on the Pricing page (passed via URL); fall back to PLANS data
  const urlPlanPrice = Number(searchParams.get("planPrice") ?? "0");
  const price = urlPlanPrice > 0
    ? urlPlanPrice
    : (billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice);
  const courseUrlPrice = Number(searchParams.get("price") ?? "0");
  const coursePriceNum = isCourse ? Number((courseInfo?.price ?? courseUrlPrice) || 0) : 0;
  const baseTotal = isBooking ? bookingPrice : isCourse ? coursePriceNum : plan.monthlyPrice;
  const total = isBooking ? bookingPrice : isCourse ? coursePriceNum : price; // never multiply by 12 — price is always the per-period amount shown on the card

  const [transferOrderNum, setTransferOrderNum] = useState(() => `PI${Math.floor(Math.random() * 900000 + 100000)}`);
  const meetLink = useMemo(() => genMeetLink(transferOrderNum), [transferOrderNum]);

  /* ── Read all booking params from URL ── */
  const bookingPosition = searchParams.get("position") ?? "";
  const bookingNote = searchParams.get("note") ?? "";
  const bookingCvFile = searchParams.get("cvFile") || null;
  const bookingJdFile = searchParams.get("jdFile") || null;
  const rebookFrom =
    searchParams.get("rebookFrom") ||
    (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("prointerview_rebook_from") : "") ||
    "";
  const [rebookCredit, setRebookCredit] = React.useState(null);
  const [rebookCreditLoading, setRebookCreditLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isBooking || !rebookFrom) {
      setRebookCredit(null);
      setRebookCreditLoading(false);
      return;
    }
    setRebookCreditLoading(true);
    void fetchRebookCredit(rebookFrom)
      .then((r) => {
        if (r.success && r.credit?.available) setRebookCredit(r.credit);
        else setRebookCredit(null);
      })
      .finally(() => setRebookCreditLoading(false));
  }, [isBooking, rebookFrom]);

  const [appStep, setAppStep] = useState("checkout");
  const [bankBookingId, setBankBookingId] = useState(null);
  const [bankEnrollmentId, setBankEnrollmentId] = useState(null);
  const [transferBusy, setTransferBusy] = useState(false);

  const [cardError, setCardError] = useState("");

  /* Coupon */
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const discount = isCourse ? 0 : couponApplied ? Math.round(total * 0.1) : 0;
  const payAmount = total - discount;
  const bookingTotalEstimate = Math.round(isBooking ? payAmount : bookingPrice);

  const rebookCreditVnd = Number(rebookCredit?.creditVnd || 0);
  const rebookSameMentor = Boolean(
    rebookCredit?.available &&
      mentorId &&
      (mentorIdsMatch(rebookCredit.excludeMentorId, mentorId) ||
        mentorIdsMatch(rebookCredit.excludeMentorId, bookingMentor?.id)),
  );
  const canUseRebookCredit = Boolean(
    rebookCredit?.available &&
      !rebookSameMentor &&
      bookingTotalEstimate > 0 &&
      bookingTotalEstimate <= rebookCreditVnd &&
      mentorId,
  );
  const rebookCreditTooLow = Boolean(
    rebookFrom &&
      rebookCredit?.available &&
      !rebookSameMentor &&
      bookingTotalEstimate > rebookCreditVnd,
  );
  const payMode = useMemo(
    () =>
      resolvePayMode({
        isBooking,
        rebookFrom,
        rebookCreditLoading,
        canUseRebookCredit,
        rebookSameMentor,
        rebookCreditTooLow,
      }),
    [isBooking, rebookFrom, rebookCreditLoading, canUseRebookCredit, rebookSameMentor, rebookCreditTooLow],
  );
  const payBlocked = payMode === PAY_MODE.REBOOK_SAME || payMode === PAY_MODE.REBOOK_LOW;
  const showStepBar = payMode === PAY_MODE.BANK || payMode === PAY_MODE.REBOOK_READY;
  const stepLabels = payMode === PAY_MODE.REBOOK_READY ? STEPS_REBOOK : STEPS_BOOKING;
  const compactRebook = rebookFrom && payMode !== PAY_MODE.BANK;

  const vietQrBankId = useMemo(() => inferVietQrBankId(), []);
  const vietQrUrl = useMemo(
    () => buildVietQrImageUrl(vietQrBankId, BANK_TRANSFER.accountNumber, payAmount, transferOrderNum),
    [vietQrBankId, transferOrderNum, payAmount],
  );
  const [vietQrLoadFailed, setVietQrLoadFailed] = useState(false);
  useEffect(() => {
    setVietQrLoadFailed(false);
  }, [vietQrUrl]);

  const submitTransferReference = async () => {
    if (isBooking) {
      if (!bankBookingId) {
        setCardError("Thiếu mã booking. Hãy quay lại bước thanh toán và tạo lịch lại.");
        return;
      }
    } else if (isCourse) {
      if (!bankEnrollmentId) {
        setCardError("Thiếu mã ghi danh. Hãy quay lại bước thanh toán.");
        return;
      }
    } else {
      return;
    }
    setTransferBusy(true);
    setCardError("");
    try {
      let ok = false;
      if (isBooking) {
        const res = await submitBookingTransferReference(bankBookingId, transferOrderNum || "");
        ok = res.success;
        if (!ok) setCardError(res.error || "Không lưu được.");
      } else {
        const res = await enrollmentApi.submitEnrollmentTransfer(bankEnrollmentId, transferOrderNum || "");
        ok = res.success;
        if (!ok) setCardError(res.error || "Không lưu được.");
      }
      if (ok) setAppStep("transfer_submitted");
    } finally {
      setTransferBusy(false);
    }
  };

  const handlePay = async () => {
    if (!isLoggedIn()) {
      setCardError("");
      const q = searchParams.toString();
      navigate(`/login?redirect=${encodeURIComponent(`/checkout?${q}`)}`);
      return;
    }

    if (!isPaidCheckout) {
      setCardError(
        "Thanh toán chuyển khoản trên trang này chỉ dành cho đặt lịch mentor hoặc mua khóa học có phí. Mua gói Pro vui lòng quay lại trang Gói cước hoặc liên hệ hỗ trợ.",
      );
      return;
    }

    if (isCourse) {
      if (!courseId) {
        setCardError("Thiếu mã khóa học.");
        return;
      }
      if (!courseInfo) {
        setCardError("Đang tải thông tin khóa học…");
        return;
      }
      const expected = Number(courseInfo.price ?? 0);
      if (!Number.isFinite(expected) || expected <= 0) {
        setCardError("Khóa học miễn phí không cần thanh toán tại đây. Hãy đăng ký trực tiếp trên trang khóa học.");
        return;
      }
      if (courseUrlPrice > 0 && Math.round(expected) !== Math.round(courseUrlPrice)) {
        setCardError("Giá khóa học không khớp. Hãy tải lại trang chi tiết khóa và thử lại.");
        return;
      }
      setCardError("");
      try {
        const apiRes = await enrollmentApi.enroll(courseId, { paymentMethod: "transfer", orderNum: transferOrderNum });
        const eid = apiRes.enrollment?._id || apiRes.enrollment?.id;
        if (apiRes.success && eid) {
          const serverOrder = extractOrderPart(apiRes.orderNum || apiRes.enrollment?.paymentRef);
          if (serverOrder) setTransferOrderNum(serverOrder);
          setBankEnrollmentId(String(eid));
          setAppStep("awaiting_transfer");
        } else {
          setCardError(apiRes.error || "Không thể tạo ghi danh chờ chuyển khoản.");
        }
      } catch {
        setCardError("Lỗi hệ thống khi ghi danh.");
      }
      return;
    }

    if (!bookingMentor || !bookingDate || !bookingTime) {
      setCardError("Thiếu thông tin đặt lịch. Hãy quay lại bước đặt lịch với mentor.");
      return;
    }

    if (rebookCreditTooLow) {
      setCardError(
        `Buổi mới ${fmt(bookingTotalEstimate)} cao hơn credit ${fmt(rebookCreditVnd)}. Chọn mentor rẻ hơn hoặc hoàn tiền ở buổi cũ.`,
      );
      return;
    }
    if (rebookSameMentor) {
      setCardError("Chọn mentor khác hoặc quay buổi cũ chọn «Đổi lịch».");
      return;
    }

    setCardError("");
    try {
      if (canUseRebookCredit && rebookFrom) {
        const apiRes = await createBooking({
          mentorId: bookingMentor.id,
          date: bookingDate,
          timeSlot: bookingTime,
          sessionType: "mock_interview",
          position: bookingPosition,
          note: bookingNote,
          cvFile: bookingCvFile || "",
          jdFile: bookingJdFile || "",
          price: bookingPrice,
          durationMinutes: 60,
          meetingLink: meetLink,
          applyRebookCreditFromBookingId: rebookFrom,
        });
        if (apiRes.success && apiRes.booking?.id) {
          try {
            sessionStorage.removeItem("prointerview_rebook_from");
          } catch {
            /* ignore */
          }
          navigate(`/session/${encodeURIComponent(apiRes.booking.id)}`);
        } else {
          setCardError(apiRes.error || "Không thể áp dụng credit đổi mentor.");
        }
        return;
      }

      const apiRes = await createBooking({
        mentorId: bookingMentor.id,
        date: bookingDate,
        time: bookingTime,
        timeSlot: bookingTime,
        sessionType: "mock_interview",
        position: bookingPosition,
        note: bookingNote,
        cvFile: bookingCvFile || "",
        jdFile: bookingJdFile || "",
        price: bookingPrice,
        durationMinutes: 60,
        meetingLink: meetLink,
        orderNum: transferOrderNum,
        paymentStatus: "pending",
        paymentMethod: "transfer",
      });
      if (apiRes.success && apiRes.booking?.id) {
        const serverOrder = extractOrderPart(apiRes.booking?.paymentRef);
        if (serverOrder) setTransferOrderNum(serverOrder);
        setBankBookingId(apiRes.booking.id);
        setAppStep("awaiting_transfer");
      } else {
        const msg = apiRes.error || "Không thể tạo lịch chờ chuyển khoản.";
        console.warn("[POST /api/bookings]", msg);
        setCardError(msg);
      }
    } catch {
      setCardError("Lỗi hệ thống khi tạo lịch hẹn.");
    }
  };

  /* ── Chờ chuyển khoản / đã gửi mã CK ── */
  if (appStep === "awaiting_transfer" || appStep === "transfer_submitted") {
    const submitted = appStep === "transfer_submitted";
    const hasBank = BANK_TRANSFER.bankName && BANK_TRANSFER.accountNumber;
    return (
      <div className="min-h-screen bg-[#07060E] text-white relative overflow-hidden flex items-center justify-center p-6">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="max-w-lg w-full glass-panel p-8 md:p-10 fade-in relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-fixed/15 border border-primary-fixed/30 flex items-center justify-center">
              <Landmark className="w-6 h-6 text-primary-fixed" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                {submitted ? "Đã ghi nhận chuyển khoản" : "Chuyển khoản ngân hàng"}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                Mã đơn: {transferOrderNum} · {fmt(payAmount)}
              </p>
            </div>
          </div>

          {!hasBank && (
            <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 leading-relaxed">
              Cấu hình <span className="font-mono">VITE_BANK_TRANSFER_NAME</span>,{" "}
              <span className="font-mono">VITE_BANK_TRANSFER_ACCOUNT</span>,{" "}
              <span className="font-mono">VITE_BANK_TRANSFER_OWNER</span>: trên máy dùng{" "}
              <span className="font-mono">frontend/.env</span> hoặc <span className="font-mono">.env.local</span>; trên
              Vercel vào <span className="font-semibold">Settings → Environment Variables</span> rồi{" "}
              <span className="font-semibold">Redeploy</span> (Vite chỉ nhúng biến lúc build).
            </p>
          )}

          {hasBank && !submitted && (
            <div className="mb-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-white/50">Ngân hàng</span>
                <span className="font-bold text-right">{BANK_TRANSFER.bankName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/50">Số TK</span>
                <span className="font-mono font-black">{BANK_TRANSFER.accountNumber}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/50">Chủ TK</span>
                <span className="font-bold text-right">{BANK_TRANSFER.accountOwner}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                <span className="text-white/50">Nội dung CK</span>
                <CopyBtn text={transferOrderNum} />
              </div>
              <p className="text-[11px] text-primary-fixed font-bold">Ghi đúng nội dung: {transferOrderNum}</p>
            </div>
          )}

          {hasBank && !submitted && vietQrUrl && !vietQrLoadFailed && (
            <div className="mb-6 flex flex-col items-center rounded-2xl border border-primary-fixed/25 bg-primary-fixed/[0.07] p-5">
              <p className="mb-1 text-center text-[10px] font-black uppercase tracking-widest text-primary-fixed">
                Quét mã QR (VietQR)
              </p>
              <p className="mb-4 text-center text-[11px] text-white/55 leading-relaxed">
                Mở app ngân hàng → Quét mã QR. Thường sẽ điền sẵn số tiền và nội dung{" "}
                <span className="font-semibold text-white">{transferOrderNum}</span>.
              </p>
              <img
                src={vietQrUrl}
                alt="Mã QR chuyển khoản VietQR"
                className="max-w-[280px] w-full rounded-xl bg-white p-2 shadow-lg"
                loading="lazy"
                onError={() => setVietQrLoadFailed(true)}
              />
              <p className="mt-4 text-center text-[11px] text-white/50 leading-relaxed">
                Sau khi chuyển xong, bấm <span className="font-semibold text-white/80">Tôi đã chuyển khoản</span> bên dưới. Admin đối soát theo{" "}
                <span className="font-semibold text-white/80">số tiền + một nội dung chuyển khoản duy nhất</span> (đã gắn trong QR).
              </p>
            </div>
          )}
          {hasBank && !submitted && vietQrUrl && vietQrLoadFailed && (
            <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-xs text-white/65">
              Không tải được mã QR. Bạn vẫn có thể chuyển thủ công theo STK và nội dung ở trên.
            </p>
          )}

          {!submitted && (
            <>
              {cardError && <p className="mb-3 text-xs text-red-400">{cardError}</p>}
              <button
                type="button"
                disabled={transferBusy}
                onClick={submitTransferReference}
                className="w-full h-14 rounded-2xl bg-primary-fixed text-black font-black uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {transferBusy ? "Đang gửi..." : "Tôi đã chuyển khoản"}
              </button>
            </>
          )}

          {submitted && (
            <p className="mb-6 text-sm text-white/70 leading-relaxed">
              Hệ thống đã ghi nhận bạn đã hoàn tất bước chuyển khoản. Admin sẽ đối soát theo{" "}
              <span className="text-white font-semibold">số tiền + nội dung mã đơn</span> rồi{" "}
              <span className="text-white font-semibold">xác nhận thanh toán</span> trong admin →{" "}
              {isCourse ? "Ghi danh khóa học" : "Lịch hẹn"}.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(isCourse ? "/courses" : "/dashboard")}
              className="flex-1 min-w-[140px] h-12 rounded-xl bg-white/10 border border-white/15 text-[10px] font-black uppercase tracking-widest hover:bg-white/15"
            >
              {isCourse ? "Về Khóa học" : "Về Dashboard"}
            </button>
            {!submitted && (
              <button
                type="button"
                onClick={() => {
                  setAppStep("checkout");
                  setBankBookingId(null);
                  setBankEnrollmentId(null);
                }}
                className="flex-1 min-w-[140px] h-12 rounded-xl border border-white/15 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white"
              >
                Quay lại
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Checkout UI ── */
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07060E] text-white antialiased">
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .glass-panel {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
        }
      `}</style>

      {/* Atmospheric Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-fixed/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      {/* ── Navbar ── */}
      <div className="sticky top-6 z-50 px-4">
        <nav className="mx-auto flex justify-between items-center px-6 lg:px-8 h-14 rounded-full w-full max-w-6xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#6E35E8] to-[#9B6DFF] flex-shrink-0 shadow-lg">
              <Sparkle className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-[1.05rem] tracking-tight whitespace-nowrap">ProInterview</span>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 whitespace-nowrap">
              <Phone className="w-3 h-3 text-primary-fixed" />
              <span>Support: 1800 1234</span>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Step bar ── */}
        {showStepBar ? <StepBar current={1} steps={stepLabels} /> : null}

        <div className="lg:flex gap-6 items-start">

          {/* ══ LEFT PANEL ══ */}
          <div className="flex-1 mb-6 lg:mb-0">
            <div className="glass-panel overflow-hidden shadow-2xl">
              {!compactRebook ? (
                <div className="flex items-center gap-4 px-8 py-4 border-b border-white/5 bg-white/5">
                  <div className="w-10 h-10 rounded-2xl bg-[#c4ff47] flex items-center justify-center">
                    <span className="text-sm font-black text-black">U</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Tài khoản</p>
                    <p className="text-sm font-bold text-white">user@prointerview.vn</p>
                  </div>
                </div>
              ) : null}

              <div className="p-8">
                <h2 className="text-2xl font-black tracking-tighter text-white mb-4">
                  {PAY_HEADING[payMode] || PAY_HEADING[PAY_MODE.BANK]}
                </h2>
                                <CheckoutPayPanel
                  mode={payMode}
                  fmt={fmt}
                  rebookCreditVnd={rebookCreditVnd}
                  bookingTotalEstimate={bookingTotalEstimate}
                  bookingMentor={bookingMentor}
                  rebookFrom={rebookFrom}
                  navigate={navigate}
                />

                {cardError && (
                  <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{cardError}</span>
                  </div>
                )}

                {!payBlocked ? (
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={!isPaidCheckout || payMode === PAY_MODE.REBOOK_LOADING}
                    className="mb-4 flex h-16 w-full items-center justify-center gap-3 rounded-3xl text-sm font-black uppercase tracking-[0.2em] text-black shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                    style={{
                      background:
                        payMode === PAY_MODE.REBOOK_READY
                          ? "linear-gradient(135deg,#6E35E8,#5b21b6)"
                          : "linear-gradient(135deg,#166534,#14532d)",
                      boxShadow:
                        payMode === PAY_MODE.REBOOK_READY
                          ? "0 20px 40px rgba(110,53,232,0.35)"
                          : "0 20px 40px rgba(22,101,52,0.35)",
                    }}
                  >
                    <Lock className="h-5 w-5" />
                    {payMode === PAY_MODE.REBOOK_READY
                      ? "Xác nhận đặt lại"
                      : isPaidCheckout
                        ? `Tiếp tục — ${fmt(payAmount)}`
                        : "Chọn luồng thanh toán"}
                  </button>
                ) : null}

                {!compactRebook && (
                  <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-8">
                    <ShieldCheck className="w-4 h-4 text-primary-fixed" />
                    Thanh toán được bảo mật SSL
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══ RIGHT PANEL: Order summary ══ */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="glass-panel overflow-hidden sticky top-24 shadow-2xl">

              {/* Summary header */}
              <div className="px-8 py-6 border-b border-white/5 bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Order Summary</p>
                <p className="text-xl font-black text-white tracking-tighter">#{transferOrderNum}</p>
              </div>

              {isBooking ? (
                /* ── BOOKING summary ── */
                <>
                  <div className="px-8 py-6 border-b border-white/5">
                    <div className="mb-6 flex items-center gap-4">
                      {bookingMentor ? (
                        <>
                          <img
                            src={bookingMentor.avatar}
                            alt={bookingMentor.name}
                            className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
                          />
                          <div>
                            <p className="text-sm font-bold text-white">{bookingMentor.name}</p>
                            <p className="text-xs text-white/40">{bookingMentor.title}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-white/50">Đang tải thông tin mentor…</p>
                      )}
                    </div>
                    <div className="space-y-4">
                      {[
                        { icon: Calendar, label: "Day", value: bookingDate || "" },
                        { icon: Clock, label: "Time", value: bookingTime || "" },
                        { icon: Video, label: "Platform", value: "Google Meet" },
                        { icon: Users, label: "Type", value: "60 mins · 1-1" },
                      ].map((row) => {
                        const RowIcon = row.icon;
                        return (
                        <div key={row.label} className="flex justify-between items-center text-xs">
                          <span className="text-white/40 font-black uppercase tracking-widest flex items-center gap-2"><RowIcon className="w-3.5 h-3.5 text-primary-fixed" />{row.label}</span>
                          <span className="text-white font-bold">{row.value}</span>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : isCourse ? (
                <>
                  <div className="px-8 py-6 border-b border-white/5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <BookOpen className="h-6 w-6 text-primary-fixed" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Khóa học</p>
                        <p className="text-sm font-bold text-white leading-snug">{courseInfo?.title || "Đang tải…"}</p>
                        <p className="mt-2 text-xs leading-relaxed text-white/50">
                          Sau khi admin xác nhận thanh toán, bạn vào học từ trang Khóa học → Khóa của tôi.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ── PLAN summary ── */
                <>
                  <div className="px-8 py-6 border-b border-white/5 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/40">Activation</span>
                      <span className="text-white">{new Date().toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/40">Cycle</span>
                      <span className="text-primary-fixed">{billing === "yearly" ? "Yarly" : "Monthly"}</span>
                    </div>
                  </div>

                  <div className="px-8 py-6 border-b border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#c4ff47] mb-4">What's included</p>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-white uppercase tracking-tighter">{plan.name} Package</span>
                        <span className="text-[10px] font-bold text-white/40">{billing === "yearly" ? "12 Months" : "1 Month"}</span>
                      </div>
                      {plan.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Check className="w-3.5 h-3.5 flex-shrink-0 text-primary-fixed mt-0.5" />
                          <span className="text-xs text-white/60 leading-relaxed">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="px-8 py-6 border-b border-white/5 bg-white/5">
                    {couponApplied ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-primary-fixed" />
                          <span className="text-sm font-black text-white">{coupon.toUpperCase()}</span>
                        </div>
                        <span className="text-[8px] font-black px-2 py-1 rounded bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 uppercase tracking-[0.2em]">Applied</span>
                      </div>
                    ) : (
                      <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/10">
                        <input
                          className="flex-1 bg-transparent text-xs px-3 focus:outline-none placeholder:text-white/20 text-white"
                          placeholder="Coupon Code"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                        />
                        <button
                          onClick={() => { if (coupon.trim()) setCouponApplied(true); }}
                          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary-fixed text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(196, 255, 71,0.3)]"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Totals */}
              <div className="px-8 py-8 space-y-4 bg-gradient-to-b from-transparent to-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Base Amount</span>
                  <span className="text-white/80 font-bold">{fmt(baseTotal)}</span>
                </div>
                {billing === "yearly" && !isCourse && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Yearly Discount</span>
                    <span className="text-[#c4ff47] font-bold">−{fmt(baseTotal - total)}</span>
                  </div>
                )}
                {couponApplied && !isCourse && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Coupon Discount (10%)</span>
                    <span className="text-[#c4ff47] font-bold">−{fmt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Transaction Fee</span>
                  <span className="text-primary-fixed font-bold italic tracking-widest">FREE</span>
                </div>
                
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                   <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Grand Total</p>
                    <p className="text-2xl font-black text-white tracking-tighter">{fmt(total - discount)}</p>
                   </div>
                   <ShieldCheck className="w-10 h-10 text-primary-fixed/20" />
                </div>
              </div>

              {/* Premium feature footer */}
              <div className="px-8 py-4 flex items-center gap-4 bg-primary-fixed">
                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-primary-fixed" />
                </div>
                <div>
                  <p className="text-black font-black text-[10px] uppercase tracking-widest">Secure Activation</p>
                  <p className="text-black/60 text-[10px] font-bold mt-0.5 whitespace-nowrap">Instant Access · Money back guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}