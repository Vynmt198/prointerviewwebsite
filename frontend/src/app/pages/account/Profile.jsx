import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Mail as EnvelopeSimple,
  Phone,
  Briefcase,
  Pencil,
  Check,
  Star,
  Mic as Microphone,
  Users,
  TrendingUp as TrendUp,
  Camera,
  ChevronRight as CaretRight,
  Zap as Lightning,
  Medal,
  GraduationCap,
  X,
  Trophy,
  Sprout as Plant,
  Sparkles,
  ArrowRight,
  FileText,
  CheckCircle,
  History,
  AlertTriangle
} from "lucide-react";
import { getPlans, getUser, updateUser, logout, getInitials, restoreSession } from "../../utils/auth";
import { applyAsMentor, fetchMyMentorProfile, updateMyMentorProfile } from "../../utils/mentorApi";

const ACHIEVEMENTS = [
  { icon: Lightning, label: "5 ngày streak", color: "from-amber-400 to-orange-500", earned: true },
  { icon: Microphone, label: "10 buổi phỏng vấn", color: "from-[#6E35E8] to-[#9B6DFF]", earned: true },
  { icon: Star, label: "Điểm STAR 4.0+", color: "from-emerald-500 to-teal-600", earned: true },
  { icon: Users, label: "3 buổi với Mentor", color: "from-sky-500 to-blue-600", earned: false },
  { icon: Medal, label: "Top 10% học viên", color: "from-pink-500 to-rose-600", earned: false },
  { icon: TrendUp, label: "Cải thiện 50%", color: "from-[#9B6DFF] to-purple-600", earned: false },
];

export function Profile() {
  const navigate = useNavigate();
  const user = getUser();
  const [editing, setEditing] = useState(false);
  const [plans, setPlans] = useState(getPlans());
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    position: user?.position || "",
    school: user?.school || "",
    field: user?.field || "",
  });
  const [saveMsg, setSaveMsg] = useState(null);
  const [mentorProfile, setMentorProfile] = useState(null);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [resubmittingMentor, setResubmittingMentor] = useState(false);
  const [mentorForm, setMentorForm] = useState({
    title: "",
    company: "",
    yearsOfExperience: "",
    bio: "",
    skills: "", // Will be converted to tags array
    careerHistory: "", // List of companies
    portfolioLink: "",
    linkedinProfile: "",
    targetRate: "", // Proposed price per session
    fields: "",
    responseTime: "",
    timezone: "Asia/Ho_Chi_Minh",
  });

  const initials = getInitials(form.name || "U");
  const isMentor = user?.role === "mentor";
  const mentorReviewStatus = mentorProfile
    ? mentorProfile?.adminReview?.status || (mentorProfile?.isVerified ? "approved" : "pending")
    : "";
  const mentorFormLockedPending = !isMentor && mentorReviewStatus === "pending";

  const handleSave = async () => {
    const userRes = await updateUser({
      name: form.name,
      email: form.email,
      phone: form.phone,
      position: form.position,
      school: form.school,
      field: form.field,
    });
    if (!userRes?.success) return;

    if (isMentor) {
      const mentorRes = await updateMyMentorProfile({
        title: mentorForm.title,
        company: mentorForm.company,
        bio: mentorForm.bio,
        experienceYears: mentorForm.yearsOfExperience,
        specialties: mentorForm.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        fields: mentorForm.fields
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        linkedinUrl: mentorForm.linkedinProfile,
        portfolioUrl: mentorForm.portfolioLink,
        pricePerHour: mentorForm.targetRate,
        responseTime: mentorForm.responseTime,
        timezone: mentorForm.timezone,
      });
      if (!mentorRes?.success) return;
      if (mentorRes.mentor) setMentorProfile(mentorRes.mentor);
    }

    setEditing(false);
    setSaveMsg("saved");
    setTimeout(() => setSaveMsg(null), 2500);
  };

  const handleApplyMentor = async () => {
    // Basic validation
    if (!mentorForm.title || !mentorForm.bio || !mentorForm.careerHistory) {
      alert("Vui lòng nhập đầy đủ các thông tin bắt buộc (Chức danh, Tiểu sử, Lịch sử làm việc).");
      return;
    }

    setApplying(true);
    // Convert comma-separated strings to arrays where needed if backend expects it
    const payload = {
      ...mentorForm,
      tags: mentorForm.skills.split(",").map(s => s.trim()).filter(s => s),
      companies: mentorForm.careerHistory.split(",").map(c => c.trim()).filter(c => c)
    };

    const res = await applyAsMentor(payload);
    setApplying(false);
    if (res.success) {
      setShowMentorModal(false);
      if (res.mentor) setMentorProfile(res.mentor);
      await restoreSession().catch(() => {});
      setSaveMsg("mentor_applied");
      setTimeout(() => setSaveMsg(null), 4000);
    } else {
      alert(res.error || "Gửi yêu cầu thất bại.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleResubmitMentorProfile = async () => {
    if (!mentorForm.title || !mentorForm.bio || !mentorForm.careerHistory) {
      alert("Vui lòng điền đủ Chức danh, Tiểu sử và Lịch sử làm việc trước khi gửi duyệt lại.");
      return;
    }
    setResubmittingMentor(true);
    const payload = {
      ...mentorForm,
      tags: mentorForm.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      companies: mentorForm.careerHistory
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    };
    const res = await applyAsMentor(payload);
    setResubmittingMentor(false);
    if (!res?.success) {
      alert(res?.error || "Không thể gửi duyệt lại hồ sơ mentor.");
      return;
    }
    if (res.mentor) {
      setMentorProfile({
        ...res.mentor,
        adminReview: {
          ...(res.mentor.adminReview || {}),
          status: "pending",
          reason: "",
        },
      });
    } else {
      setMentorProfile((prev) =>
        prev
          ? {
              ...prev,
              adminReview: {
                ...(prev.adminReview || {}),
                status: "pending",
                reason: "",
              },
            }
          : prev,
      );
    }
    await restoreSession().catch(() => {});
    setSaveMsg("mentor_resubmitted");
    setTimeout(() => setSaveMsg(null), 4000);
  };

  const STATS = [
    { label: "Tổng phỏng vấn AI", value: "15", icon: Microphone, color: "#6E35E8" },
    { label: "Phỏng vấn Mentor", value: "3", icon: Users, color: "#B4F500" },
    { label: "Điểm STAR tốt nhất", value: "4.8/5", icon: Star, color: "#f59e0b" },
    { label: "Tỷ lệ cải thiện", value: "+71%", icon: TrendUp, color: "#38bdf8" },
  ];

  const FORM_FIELDS = [
    { label: "Họ và tên", key: "name", icon: User },
    { label: "Email", key: "email", icon: EnvelopeSimple },
    { label: "Số điện thoại", key: "phone", icon: Phone },
    { label: "Vị trí/Nghề nghiệp", key: "position", icon: Briefcase },
    { label: "Trường/Tổ chức", key: "school", icon: GraduationCap },
    { label: "Lĩnh vực", key: "field", icon: Sparkles },
  ];

  const planInfo = (() => {
    if (plans.elitePro) return {
      name: "Thượng hạng (Elite)",
      nameIcon: Medal,
      badge: { bg: "bg-primary-fixed/20", border: "border-primary-fixed/30", icon: "text-primary-fixed", text: "text-primary-fixed" },
      cardGrad: "linear-gradient(145deg, #0E0922 0%, #1a0d35 100%)",
      desc: "Không giới hạn · Phân tích hành vi · Mentor 1:1",
      progress: null,
      isPaid: true,
      accent: "#B4F500"
    };
    if (plans.starterPro) return {
      name: "Chuyên nghiệp (Pro)",
      nameIcon: Lightning,
      badge: { bg: "bg-sky-500/20", border: "border-sky-500/30", icon: "text-sky-400", text: "text-sky-400" },
      cardGrad: "linear-gradient(135deg, #6E35E8 0%, #8B4DFF 100%)",
      desc: "Phỏng vấn AI · Nhận diện giọng nói · 10 buổi/tháng",
      progress: { used: 0, max: 10 },
      isPaid: true,
      accent: "#6E35E8"
    };
    return {
      name: "Cơ bản (Free)",
      nameIcon: Plant,
      badge: { bg: "bg-orange-500/20", border: "border-orange-500/30", icon: "text-orange-500", text: "text-orange-500" },
      cardGrad: "linear-gradient(145deg, #2D1B69 0%, #3B2A82 100%)",
      desc: "2 buổi AI miễn phí · 3 lần phân tích CV",
      progress: { used: 2, max: 2 },
      isPaid: false,
      accent: "#f59e0b"
    };
  })();
  const upgradeLabel = plans.starterPro ? "Elite" : "Chuyên nghiệp (Pro)";
  const canUpgradePlan = !plans.elitePro;

  React.useEffect(() => {
    const refresh = () => setPlans(getPlans());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  React.useEffect(() => {
    if (!user?.email) return;
    fetchMyMentorProfile().then((res) => {
      if (!res?.success || !res.mentor) {
        setMentorProfile(null);
        return;
      }
      const m = res.mentor;
      setMentorProfile(m);
      setMentorForm((prev) => ({
        ...prev,
        title: m.title || "",
        company: m.company || "",
        yearsOfExperience: String(m.experienceYears ?? ""),
        bio: m.bio || "",
        skills: Array.isArray(m.specialties) ? m.specialties.join(", ") : "",
        careerHistory: Array.isArray(m.companies) ? m.companies.join(", ") : "",
        linkedinProfile: m.linkedinUrl || "",
        portfolioLink: m.portfolioUrl || "",
        targetRate: String(m.pricePerHour ?? ""),
        fields: Array.isArray(m.fields) ? m.fields.join(", ") : "",
        responseTime: m.responseTime || "",
        timezone: m.timezone || "Asia/Ho_Chi_Minh",
      }));
    });
  }, [user?.email]);

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-20 font-sans antialiased bg-[#f8f4ff] text-slate-900 selection:bg-[rgba(122,35,229,0.18)] selection:text-slate-900">
      <style>{`
        .glass-card {
           background: #ffffff;
           backdrop-filter: none;
           border-radius: 28px;
           border: 1px solid rgba(148, 163, 184, 0.28);
           transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease, box-shadow 0.45s ease;
           position: relative;
           overflow: hidden;
           box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }
        .glass-card::before {
           content: none;
        }
        .glass-card:hover {
           border-color: rgba(122, 35, 229, 0.28);
           transform: translateY(-2px);
           box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
        }
        .font-headline {
          letter-spacing: -0.045em;
          text-shadow: none;
        }
        .glow-halo { position: relative; display: flex; align-items: center; justify-content: center; }
        .glow-halo::after {
           content: '';
           position: absolute;
           width: 150%;
           height: 150%;
           background: radial-gradient(circle, rgba(232,121,249,0.35) 0%, rgba(110,53,232,0.15) 40%, transparent 70%);
           border-radius: 50%;
           z-index: -1;
           animation: pulse-halo 3.2s ease-in-out infinite;
        }
        @keyframes pulse-halo {
           0%, 100% { transform: scale(1); opacity: 0.55; }
           50% { transform: scale(1.15); opacity: 0.95; }
        }
        .input-glass {
           background: #ffffff;
           border: 1px solid #e2e8f0;
           border-radius: 14px;
           color: #0f172a;
           padding: 12px 16px;
           font-size: 0.875rem;
           font-weight: 500;
           letter-spacing: -0.01em;
           transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .input-glass:focus {
           background: #ffffff;
           border-color: rgba(122, 35, 229, 0.45);
           outline: none;
           box-shadow: 0 0 0 2px rgba(122, 35, 229, 0.12);
        }
        .input-glass:disabled { opacity: 0.55; cursor: not-allowed; }
        .input-glass::placeholder { color: #94a3b8; }
        .profile-glass-danger:hover {
          transform: none;
          border-color: rgba(239, 68, 68, 0.4);
          box-shadow: 0 16px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(239, 68, 68, 0.12) inset;
        }
        @keyframes profile-shimmer {
          0% { opacity: 0.4; transform: translate(0,0) scale(1); }
          50% { opacity: 0.7; transform: translate(2%, -2%) scale(1.05); }
          100% { opacity: 0.4; transform: translate(0,0) scale(1); }
        }
        .pricing-grid {
          position: fixed;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          opacity: 1;
          background-image:
            linear-gradient(rgba(148,71,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,71,255,0.06) 1px, transparent 1px);
          background-size: 64px 64px;
        }
      `}</style>

      <div className="pricing-grid" aria-hidden />
      <div className="fixed inset-0 pointer-events-none -z-[3]" style={{ background: "#f8f4ff" }} />
      <div className="fixed top-[-22%] left-[-12%] w-[760px] h-[760px] rounded-full pointer-events-none -z-0 bg-[#d4ff00]/48 blur-[135px]" />
      <div className="fixed bottom-[-22%] right-[-10%] w-[820px] h-[820px] rounded-full pointer-events-none -z-0 bg-[#9447ff]/34 blur-[150px]" />
      <div className="fixed left-0 right-0 top-[38%] h-[180px] pointer-events-none -z-0" style={{ background: "linear-gradient(90deg, rgba(212,255,0,0.14) 0%, rgba(148,71,255,0.22) 55%, rgba(148,71,255,0.1) 100%)", filter: "blur(32px)" }} />
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-8 pt-8 sm:px-8 sm:pt-10">
        <div className="mb-10 flex flex-col justify-between gap-8 border-b border-slate-200 pb-10 md:mb-12 md:flex-row md:items-end">
          <div className="min-w-0">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Tài khoản</p>
            <h1 className="font-headline mb-2 text-4xl font-black tracking-tighter text-slate-900 sm:text-5xl md:text-6xl">
              Hồ sơ cá nhân
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-slate-600">
              Trung tâm cấu hình và quản trị tài khoản tối ưu
            </p>
          </div>

          <div className="flex gap-4">
            {editing ? (
               <>
                 <button onClick={() => setEditing(false)} className="px-6 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                    <X size={14} /> Hủy
                 </button>
                 <button onClick={handleSave} className="px-8 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                    <Check size={16} /> Lưu thay đổi
                 </button>
               </>
            ) : (
               <button onClick={() => setEditing(true)} className="px-8 py-4 rounded-2xl bg-[#7a23e5] text-white text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_10px_28px_rgba(122,35,229,0.28)]">
                  <Pencil size={16} /> Chỉnh sửa hồ sơ
               </button>
            )}
          </div>
        </div>

        {/* Status messages */}
        {saveMsg === "saved" && (
          <div className="fixed bottom-10 right-10 z-50 flex items-center gap-3 bg-emerald-600/90 backdrop-blur-xl text-white px-8 py-4 rounded-2xl shadow-2xl border border-emerald-400/30 font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-bottom-5">
            <Check size={18} /> Đã cập nhật thành công
          </div>
        )}
        {saveMsg === "mentor_applied" && (
          <div className="fixed bottom-10 right-10 z-50 flex items-center gap-4 bg-[#6E35E8] text-white px-8 py-5 rounded-2xl shadow-2xl border border-violet-300/40 font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-bottom-5 max-w-md">
            <div className="bg-emerald-500 rounded-full p-1"><Check size={14} /></div>
            <div>
              <p>Hồ sơ đã được gửi!</p>
              <p className="text-[9px] text-white/80 mt-1 lowercase first-letter:uppercase font-medium">Hệ thống sẽ phản hồi kết quả trong vòng 24-48 giờ làm việc.</p>
            </div>
          </div>
        )}
        {saveMsg === "mentor_resubmitted" && (
          <div className="fixed bottom-10 right-10 z-50 flex items-center gap-4 bg-amber-500 text-slate-900 px-8 py-5 rounded-2xl shadow-2xl border border-amber-300/70 font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-bottom-5 max-w-md">
            <div className="bg-slate-900 text-white rounded-full p-1"><Check size={14} /></div>
            <div>
              <p>Đã gửi duyệt lại hồ sơ mentor!</p>
              <p className="text-[9px] text-slate-800 mt-1 lowercase first-letter:uppercase font-semibold">Admin sẽ xem xét lại hồ sơ của bạn trong thời gian sớm nhất.</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-10">
            <div className="glass-card p-10 text-center">
               <div className="glow-halo mb-8">
                  <div className="w-32 h-32 rounded-[34px] bg-[#f8f5ff] border-[3px] border-[#7a23e5] flex items-center justify-center text-[2.3rem] font-black text-[#7a23e5] shadow-[0_10px_24px_rgba(122,35,229,0.25)]">
                     {initials}
                  </div>
               </div>
               
               <h2 className="mb-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{form.name || "Người dùng"}</h2>
               <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{planInfo.name}</p>
               
               {!isMentor && (
                 <div className="pt-8 border-t border-slate-200">
                    {!mentorProfile ? (
                    <button
                      type="button"
                      onClick={() => setShowMentorModal(true)}
                      className="w-full p-4 rounded-2xl border border-[#74c9f5] bg-[#c9ebff] text-left flex items-center justify-between group hover:brightness-95 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Lightning size={18} className="text-[#0ea5e9]" />
                        <span className="text-[#0ea5e9] text-[10px] font-black uppercase tracking-widest">
                          Đăng ký mentor
                        </span>
                      </div>
                      <span className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-slate-700">
                        <CaretRight size={16} />
                      </span>
                    </button>
                    ) : mentorReviewStatus === "pending" ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-semibold text-amber-900">
                        Hồ sơ cố vấn đã gửi — đang chờ quản trị phê duyệt. Bạn vẫn dùng giao diện học viên cho đến khi được duyệt.
                      </div>
                    ) : null}
                 </div>
               )}
            </div>

            <div className="glass-card p-8">
               <h3 className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  <TrendUp size={14} className="text-[#7a23e5]" strokeWidth={2} /> Thống kê vận hành
               </h3>
               <div className="grid grid-cols-2 gap-6">
                  {STATS.map((stat, i) => (
                    <div key={i}>
                       <p className="mb-2 text-[9px] font-bold uppercase leading-none tracking-wide text-slate-500">{stat.label}</p>
                       <p className="text-xl font-black text-slate-900 tracking-tighter" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                  ))}
               </div>
            </div>

          </div>

          <div className="lg:col-span-8 space-y-10">
            <div className="glass-card p-10">
               <div className="flex items-center justify-between mb-10">
                  <h2 className="font-headline flex items-center gap-3 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                     <User size={20} className="text-[#7a23e5]" strokeWidth={2} /> Thông tin cốt lõi
                  </h2>
               </div>
               <div className="grid md:grid-cols-2 gap-8">
                  {FORM_FIELDS.map(({ label, key, icon: Icon }) => (
                    <div key={key} className="space-y-3">
                       <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          <Icon size={12} /> {label}
                       </label>
                       <input
                         disabled={!editing}
                         className="input-glass w-full"
                         value={form[key]}
                         onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                         placeholder={editing ? `Nhập ${label.toLowerCase()}...` : "Dữ liệu trống"}
                       />
                    </div>
                  ))}
               </div>
            </div>

            {mentorProfile && (
              <div className="glass-card p-10">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="font-headline flex items-center gap-3 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                    <Briefcase size={20} className="text-primary-fixed" strokeWidth={2} /> Hồ sơ mentor
                  </h2>
                  {mentorReviewStatus === "pending" ? (
                    <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                      Đang chờ duyệt
                    </span>
                  ) : mentorReviewStatus === "approved" ? (
                    <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                      Đã duyệt
                    </span>
                  ) : mentorReviewStatus === "rejected" ? (
                    <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-700">
                      Đã từ chối
                    </span>
                  ) : null}
                </div>
                {mentorProfile?.adminReview?.status === "rejected" && mentorProfile?.adminReview?.reason ? (
                  <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-amber-700">
                          Hồ sơ từng bị từ chối
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">Lý do gần nhất từ admin:</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700">{mentorProfile.adminReview.reason}</p>
                        <p className="mt-2 text-[11px] text-slate-500">
                          Hãy cập nhật hồ sơ theo góp ý rồi lưu lại để gửi duyệt lại.
                        </p>
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={handleResubmitMentorProfile}
                            disabled={resubmittingMentor}
                            className="rounded-xl bg-amber-500 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {resubmittingMentor ? "Đang gửi duyệt lại..." : "Đánh dấu đã chỉnh sửa & gửi duyệt lại hồ sơ mentor"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    { label: "Chức danh mentor", key: "title" },
                    { label: "Công ty", key: "company" },
                    { label: "Năm kinh nghiệm", key: "yearsOfExperience", type: "number" },
                    { label: "Mức phí / giờ (VNĐ)", key: "targetRate", type: "number" },
                    { label: "Lĩnh vực mentor", key: "fields" },
                    { label: "Kỹ năng (cách nhau dấu phẩy)", key: "skills" },
                    { label: "LinkedIn", key: "linkedinProfile" },
                    { label: "Phản hồi trung bình", key: "responseTime" },
                    { label: "Múi giờ", key: "timezone" },
                  ].map((field) => (
                    <div key={field.key} className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{field.label}</label>
                      <input
                        disabled={!editing || mentorFormLockedPending}
                        type={field.type || "text"}
                        className="input-glass w-full"
                        value={mentorForm[field.key] || ""}
                        onChange={(e) => setMentorForm({ ...mentorForm, [field.key]: e.target.value })}
                        placeholder={editing ? `Nhập ${field.label.toLowerCase()}...` : "Dữ liệu trống"}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Tiểu sử mentor</label>
                    <textarea
                      disabled={!editing || mentorFormLockedPending}
                      rows={4}
                      className="input-glass w-full resize-none"
                      value={mentorForm.bio}
                      onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                      placeholder={editing ? "Nhập giới thiệu ngắn về mentor..." : "Dữ liệu trống"}
                    />
                  </div>
                </div>
                {mentorProfile?.finance?.bankAccount?.bankName && (
                  <p className="mt-6 text-xs text-slate-500">
                    Tài khoản nhận tiền hiện tại: {mentorProfile.finance.bankAccount.bankName} - ****
                    {String(mentorProfile.finance.bankAccount.accountNumber || "").slice(-4)}
                  </p>
                )}
              </div>
            )}

            {!isMentor && (
              <>
                <div className="glass-card overflow-hidden group">
                  <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-10" style={{ background: "linear-gradient(135deg, #6E35E8 0%, #8B5CF6 55%, #7C3AED 100%)" }}>
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/75 mb-3">Tài khoản hiện tại</p>
                      <h3 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                        {planInfo.name} <planInfo.nameIcon size={24} className="text-white/80" />
                      </h3>
                      <p className="text-sm font-medium text-white/90 mb-8 max-w-sm">{planInfo.desc}</p>
                      {canUpgradePlan && (
                        <button
                          onClick={() => navigate("/pricing")}
                          className="px-10 py-5 rounded-2xl bg-[#B4F500] text-slate-900 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_12px_28px_rgba(132,204,22,0.28)] flex items-center gap-3"
                        >
                          Nâng cấp {upgradeLabel} <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full border-8 border-white/10 flex items-center justify-center p-6 bg-white/[0.05] backdrop-blur-xl relative overflow-hidden">
                        <Lightning size={40} className="text-white/20 absolute -right-2 -top-2 rotate-12" />
                        <Lightning size={64} className="text-white group-hover:scale-110 transition-transform duration-700" />
                      </div>
                    </div>
                  </div>
                  {planInfo.progress && (
                    <div className="px-10 py-8 bg-[#F5F3FF] flex flex-col gap-3 border-t border-violet-200/50">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">Mức độ vận hành</span>
                        <span className="text-[#7a23e5]">{planInfo.progress.used} / {planInfo.progress.max} Buổi</span>
                      </div>
                      <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(planInfo.progress.used / planInfo.progress.max) * 100}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-[#7a23e5] to-[#a78bfa]"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </>
            )}

          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMentorModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMentorModal(false)}
              className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-card overflow-hidden bg-white"
            >
              <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Đăng ký trở thành <span className="text-[#7a23e5]">Mentor</span></h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Cập nhật hồ sơ chuyên gia của bạn</p>
                </div>
                <button onClick={() => setShowMentorModal(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Briefcase size={12} /> Chức danh hiện tại*
                    </label>
                    <input 
                      autoFocus
                      className="input-glass w-full" 
                      placeholder="VD: Senior Frontend Developer"
                      value={mentorForm.title}
                      onChange={e => setMentorForm({...mentorForm, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Users size={12} /> Công ty hiện tại
                    </label>
                    <input 
                      className="input-glass w-full" 
                      placeholder="VD: Google / VinAI"
                      value={mentorForm.company}
                      onChange={e => setMentorForm({...mentorForm, company: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <TrendUp size={12} /> Tổng số năm kinh nghiệm
                    </label>
                    <input 
                      type="number"
                      className="input-glass w-full" 
                      placeholder="Nhập số năm..."
                      value={mentorForm.yearsOfExperience}
                      onChange={e => setMentorForm({...mentorForm, yearsOfExperience: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Sparkles size={12} /> Kỹ năng chuyên môn (Tags)
                    </label>
                    <input 
                      className="input-glass w-full" 
                      placeholder="Cách nhau bởi dấu phẩy (VD: React, Node.js...)"
                      value={mentorForm.skills}
                      onChange={e => setMentorForm({...mentorForm, skills: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <FileText size={12} /> Giới thiệu bản thân (Bio)*
                  </label>
                  <textarea 
                    rows={4}
                    className="input-glass w-full resize-none" 
                    placeholder="Hãy viết một đoạn ngắn giới thiệu về thế mạnh và lý do bạn muốn làm Mentor..."
                    value={mentorForm.bio}
                    onChange={e => setMentorForm({...mentorForm, bio: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <History size={12} /> Lịch sử sự nghiệp (Career History)*
                  </label>
                  <textarea 
                    rows={2}
                    className="input-glass w-full resize-none" 
                    placeholder="Danh sách các công ty từng làm việc, cách nhau bởi dấu phẩy..."
                    value={mentorForm.careerHistory}
                    onChange={e => setMentorForm({...mentorForm, careerHistory: e.target.value})}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <EnvelopeSimple size={12} /> LinkedIn Profile
                    </label>
                    <input 
                      className="input-glass w-full" 
                      placeholder="https://linkedin.com/in/..."
                      value={mentorForm.linkedinProfile}
                      onChange={e => setMentorForm({...mentorForm, linkedinProfile: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Lightning size={12} /> Mức phí mong muốn (VNĐ/60p)
                    </label>
                    <input 
                      type="number"
                      className="input-glass w-full" 
                      placeholder="VD: 500000"
                      value={mentorForm.targetRate}
                      onChange={e => setMentorForm({...mentorForm, targetRate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Medal size={12} /> Portfolio / Link Chứng chỉ khác
                  </label>
                  <input 
                    className="input-glass w-full" 
                    placeholder="https://..."
                    value={mentorForm.portfolioLink}
                    onChange={e => setMentorForm({...mentorForm, portfolioLink: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-8 border-t border-slate-200 flex gap-4">
                <button 
                  onClick={() => setShowMentorModal(false)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Đóng
                </button>
                <button 
                  disabled={applying || !mentorForm.title || !mentorForm.bio || !mentorForm.careerHistory}
                  onClick={handleApplyMentor}
                  className="flex-[2] py-4 rounded-2xl bg-[#A3D900] text-slate-900 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(132,204,22,0.28)]"
                >
                  {applying ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full" />
                  ) : (
                    <><CheckCircle size={14} /> Gửi hồ sơ đăng ký</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}