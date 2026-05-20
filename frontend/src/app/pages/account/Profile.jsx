import React, { useState } from "react";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { useNavigate } from "react-router";
import {
  User,
  Mail as EnvelopeSimple,
  Phone,
  Briefcase,
  Check,
  Star,
  Mic as Microphone,
  Users,
  TrendingUp as TrendUp,
  Camera,
  ChevronRight as CaretRight,
  Zap as Lightning,
  Medal,
  X,
  Trophy,
  Sprout as Plant,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import {
  getPlans,
  getUser,
  updateUser,
  logout,
  getInitials,
  restoreSession,
  PLANS_CHANGED_EVENT,
} from "../../utils/auth";
import { applyAsMentor, fetchMyMentorProfile, updateMyMentorProfile } from "../../utils/mentorApi";
import { buildMentorApplyPayload } from "../../utils/mentorApplyPayload";
import {
  getCvSectionKeysToExpand,
  getProfileCvMissing,
  mentorApplyBlockedMessage,
  MENTOR_APPLY_PENDING_MSG,
  PROFILE_CV_MENTOR_HINT,
} from "../../utils/profileCvValidation";
import {
  ProfileCvAccordionSection,
  ProfileCvStaticSection,
  ProfileCvTextarea,
} from "../../components/profile/ProfileCvSection";
import { ProfileWorkHistoryEditor } from "../../components/profile/ProfileWorkHistoryEditor";
import { uploadFile } from "../../utils/uploadApi";
import {
  emptyWorkEntry,
  estimateExperienceYears,
  formatWorkHistoryLines,
  parseWorkHistory,
  pickCurrentWorkEntry,
  serializeWorkHistory,
} from "../../utils/profileWorkHistory";

function buildCvProfileFromSources(u, mentor) {
  const skillsFromUser =
    Array.isArray(u?.expertise) && u.expertise.length
      ? u.expertise.join(", ")
      : u?.field
        ? String(u.field)
        : "";
  const rawWork = u?.profileWorkExperience || mentor?.profileWorkExperience || "";
  let workHistory = parseWorkHistory(rawWork);
  const hasStructured = String(rawWork).trim().startsWith("{");
  if (!hasStructured && (mentor?.title || u?.position || mentor?.company || u?.currentCompany)) {
    const cur = pickCurrentWorkEntry(workHistory) || emptyWorkEntry();
    workHistory = [
      {
        ...cur,
        role: mentor?.title || u?.position || cur.role,
        company: mentor?.company || u?.currentCompany || cur.company,
        isCurrent: true,
      },
      ...workHistory.slice(1),
    ];
  }
  const current = pickCurrentWorkEntry(workHistory);
  const years =
    mentor?.experienceYears ?? u?.experience ?? estimateExperienceYears(workHistory) ?? "";
  return {
    intro: mentor?.bio || u?.bio || "",
    title: current?.role || mentor?.title || u?.position || "",
    company: current?.company || mentor?.company || u?.currentCompany || "",
    yearsOfExperience: String(years ?? ""),
    workHistory,
    workExperience: hasStructured ? formatWorkHistoryLines(workHistory) : String(rawWork).trim(),
    education: u?.profileEducation || u?.school || "",
    extracurricular: u?.profileExtracurricular || "",
    awards: u?.profileAwards || "",
    skillsCerts:
      (Array.isArray(mentor?.specialties) && mentor.specialties.length
        ? mentor.specialties.join(", ")
        : "") || skillsFromUser,
    linkedinProfile: mentor?.linkedinUrl || "",
    portfolioLink: mentor?.portfolioUrl || "",
    targetRate: String(mentor?.pricePerHour ?? ""),
    fields: Array.isArray(mentor?.fields) ? mentor.fields.join(", ") : "",
    responseTime: mentor?.responseTime || "",
    timezone: mentor?.timezone || "Asia/Ho_Chi_Minh",
  };
}

function syncCvFromWorkHistory(cv) {
  const entries = Array.isArray(cv.workHistory) ? cv.workHistory : [];
  const current = pickCurrentWorkEntry(entries);
  const manualYears = Number(cv.yearsOfExperience);
  const autoYears = estimateExperienceYears(entries);
  const years = Number.isFinite(manualYears) && manualYears >= 0 ? manualYears : autoYears ?? 0;
  return {
    ...cv,
    title: current?.role ?? cv.title ?? "",
    company: current?.company ?? cv.company ?? "",
    yearsOfExperience: years > 0 ? String(years) : cv.yearsOfExperience ?? "",
    workExperience: entries.length ? formatWorkHistoryLines(entries) : cv.workExperience,
  };
}

async function persistCvProfileToUser(cv) {
  const splitCsv = (s) =>
    String(s ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  const synced = syncCvFromWorkHistory(cv);
  const years = Number(synced.yearsOfExperience);
  const workStored = serializeWorkHistory(synced.workHistory || []);
  return updateUser({
    bio: synced.intro,
    position: synced.title,
    company: synced.company,
    experience: Number.isFinite(years) && years >= 0 ? years : 0,
    school: synced.education,
    profileWorkExperience: workStored,
    profileEducation: synced.education,
    profileExtracurricular: synced.extracurricular,
    profileAwards: synced.awards,
    expertise: splitCsv(synced.skillsCerts),
  });
}

const ACHIEVEMENTS = [
  { icon: Lightning, label: "5 ngày streak", color: "from-[#B4F500] to-[#93D600]", earned: true },
  { icon: Microphone, label: "10 buổi phỏng vấn", color: "from-[#6E35E8] to-[#8B4DFF]", earned: true },
  { icon: Star, label: "Điểm STAR 4.0+", color: "from-[#B4F500] to-[#A3D900]", earned: true },
  { icon: Users, label: "3 buổi với Mentor", color: "from-[#8B4DFF] to-[#6E35E8]", earned: false },
  { icon: Medal, label: "Top 10% học viên", color: "from-[#6E35E8] to-[#7a23e5]", earned: false },
  { icon: TrendUp, label: "Cải thiện 50%", color: "from-[#B4F500] to-[#93D600]", earned: false },
];

export function Profile() {
  const navigate = useNavigate();
  const user = getUser();
  const [plans, setPlans] = useState(getPlans());
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [saveMsg, setSaveMsg] = useState(null);
  const [mentorProfile, setMentorProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [mentorApplyError, setMentorApplyError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = React.useRef(null);
  const [cvProfile, setCvProfile] = useState(() => buildCvProfileFromSources(user, null));
  const [openCvSections, setOpenCvSections] = useState({
    intro: false,
    work: false,
    education: false,
    extracurricular: false,
    awards: false,
    skills: false,
    mentorExtra: false,
  });

  const toggleCvSection = (key) => {
    setOpenCvSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandCvSectionsForEdit = (cv = cvProfile) => {
    const keys = getCvSectionKeysToExpand(cv);
    if (!keys.length) return;
    setOpenCvSections((prev) => {
      const next = { ...prev };
      for (const key of keys) next[key] = true;
      return next;
    });
  };

  const initials = getInitials(form.name || "U");
  const isMentor = user?.role === "mentor";
  const mentorReviewStatus = mentorProfile
    ? mentorProfile?.adminReview?.status || (mentorProfile?.isVerified ? "approved" : "pending")
    : "";
  const mentorFormLockedPending = !isMentor && mentorReviewStatus === "pending";
  const profileCanEdit = !mentorFormLockedPending;

  const handleSaveProfile = async () => {
    setSaving(true);
    const userRes = await updateUser({
      name: form.name,
      email: form.email,
      phone: form.phone,
    });
    if (!userRes?.success) {
      setSaving(false);
      alert(userRes?.error || "Không lưu được thông tin liên hệ.");
      return;
    }

    const cvRes = await persistCvProfileToUser(cvProfile);
    if (!cvRes?.success) {
      setSaving(false);
      alert(cvRes?.error || "Không lưu được hồ sơ cá nhân.");
      return;
    }

    if (isMentor) {
      const splitCsv = (s) =>
        String(s ?? "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      const mentorRes = await updateMyMentorProfile({
        title: cvProfile.title,
        company: cvProfile.company,
        bio: cvProfile.intro,
        experienceYears: cvProfile.yearsOfExperience,
        specialties: splitCsv(cvProfile.skillsCerts),
        fields: splitCsv(cvProfile.fields),
        linkedinUrl: cvProfile.linkedinProfile,
        portfolioUrl: cvProfile.portfolioLink,
        pricePerHour: cvProfile.targetRate,
        responseTime: cvProfile.responseTime,
        timezone: cvProfile.timezone,
      });
      if (!mentorRes?.success) {
        setSaving(false);
        alert(mentorRes?.error || "Không cập nhật được hồ sơ mentor.");
        return;
      }
      if (mentorRes.mentor) setMentorProfile(mentorRes.mentor);
    }

    setSaving(false);
    setSaveMsg("saved");
    setTimeout(() => setSaveMsg(null), 2500);
  };

  const scrollToCv = () => {
    document.getElementById("profile-cv")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Một nút «Đăng ký làm Mentor»: thiếu → nhắc điền đủ; chờ duyệt → đã gửi; đủ → gửi / gửi lại. */
  const handleSidebarMentorRegister = () => {
    if (mentorReviewStatus === "pending") {
      setMentorApplyError(MENTOR_APPLY_PENDING_MSG);
      scrollToCv();
      return;
    }

    const missing = getProfileCvMissing(cvProfile);
    if (missing.length) {
      setMentorApplyError(mentorApplyBlockedMessage(missing));
      expandCvSectionsForEdit();
      scrollToCv();
      return;
    }

    setMentorApplyError("");
    handleApplyMentor();
  };

  const handleApplyMentor = async () => {
    const wasResubmit = mentorReviewStatus === "rejected";

    setApplying(true);
    const saved = await persistCvProfileToUser(cvProfile);
    if (!saved?.success) {
      setApplying(false);
      alert(saved?.error || "Không lưu được hồ sơ cá nhân.");
      return;
    }
    const res = await applyAsMentor(buildMentorApplyPayload(cvProfile));
    setApplying(false);
    if (res.success) {
      if (res.mentor) setMentorProfile(res.mentor);
      await restoreSession().catch(() => {});
      setSaveMsg(wasResubmit ? "mentor_resubmitted" : "mentor_applied");
      setTimeout(() => setSaveMsg(null), 4000);
    } else {
      alert(res.error || "Gửi yêu cầu thất bại.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh (JPG, PNG, …).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh tối đa 5MB.");
      return;
    }
    setAvatarUploading(true);
    const up = await uploadFile(file, "avatar");
    if (!up.success || !up.url) {
      setAvatarUploading(false);
      alert(up.error || "Upload ảnh thất bại.");
      return;
    }
    const res = await updateUser({ avatar: up.url });
    setAvatarUploading(false);
    if (res.success) {
      setAvatarUrl(up.url);
      setSaveMsg("avatar");
      setTimeout(() => setSaveMsg(null), 2500);
    } else {
      alert(res.error || "Không lưu được ảnh đại diện.");
    }
  };

  const STATS = [
    { label: "Tổng phỏng vấn AI", value: "15", icon: Microphone, color: "#6E35E8" },
    { label: "Phỏng vấn Mentor", value: "3", icon: Users, color: "#B4F500" },
    { label: "Điểm STAR tốt nhất", value: "4.8/5", icon: Star, color: "#7a23e5" },
    { label: "Tỷ lệ cải thiện", value: "+71%", icon: TrendUp, color: "#B4F500" },
  ];

  const FORM_FIELDS = [
    { label: "Họ và tên", key: "name", icon: User },
    { label: "Email", key: "email", icon: EnvelopeSimple },
    { label: "Số điện thoại", key: "phone", icon: Phone },
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
      badge: { bg: "bg-[#B4F500]/20", border: "border-[#B4F500]/40", icon: "text-[#93D600]", text: "text-[#7a23e5]" },
      cardGrad: "linear-gradient(135deg, #6E35E8 0%, #8B4DFF 100%)",
      desc: "Phỏng vấn AI · Nhận diện giọng nói · 10 buổi/tháng",
      progress: { used: 0, max: 10 },
      isPaid: true,
      accent: "#6E35E8"
    };
    return {
      name: "Cơ bản (Free)",
      nameIcon: Plant,
      badge: { bg: "bg-[#6E35E8]/15", border: "border-[#6E35E8]/30", icon: "text-[#7a23e5]", text: "text-[#7a23e5]" },
      cardGrad: "linear-gradient(145deg, #2D1B69 0%, #3B2A82 100%)",
      desc: "2 buổi AI miễn phí · 3 lần phân tích CV",
      progress: { used: 2, max: 2 },
      isPaid: false,
      accent: "#B4F500"
    };
  })();
  React.useEffect(() => {
    const refresh = () => setPlans(getPlans());
    window.addEventListener(PLANS_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(PLANS_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  React.useEffect(() => {
    restoreSession().catch(() => {});
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
      setCvProfile(buildCvProfileFromSources(getUser(), m));
    });
  }, [user?.email]);

  return (
    <MentorPageShell
      bottomPad="pb-20"
      className="text-[#2D1B69] selection:bg-[#B4F500]/35 selection:text-[#2D1B69]"
    >
      <style>{`
        .profile-page {
          --pf-purple: #6E35E8;
          --pf-purple-dark: #7a23e5;
          --pf-purple-deep: #2D1B69;
          --pf-purple-soft: #f8f5ff;
          --pf-lime: #B4F500;
          --pf-lime-dark: #93D600;
          --pf-lime-soft: rgba(180, 245, 0, 0.2);
          color: var(--pf-purple-deep);
        }
        .profile-page .profile-muted { color: rgba(45, 27, 105, 0.58); }
        .profile-page .profile-divider { border-color: rgba(110, 53, 232, 0.14); }
        .profile-page .profile-banner-info {
          border: 1px solid rgba(110, 53, 232, 0.22);
          background: var(--pf-purple-soft);
          color: var(--pf-purple-deep);
        }
        .profile-page .profile-banner-lime {
          border: 1px solid rgba(180, 245, 0, 0.45);
          background: var(--pf-lime-soft);
          color: var(--pf-purple-deep);
        }
        .profile-page .profile-badge-pending,
        .profile-page .profile-badge-approved {
          border: 1px solid rgba(180, 245, 0, 0.5);
          background: var(--pf-lime-soft);
          color: var(--pf-purple-deep);
        }
        .profile-page .profile-badge-rejected {
          border: 1px solid rgba(110, 53, 232, 0.35);
          background: var(--pf-purple-soft);
          color: var(--pf-purple-dark);
        }
        .profile-page .glass-card {
           background: #ffffff;
           backdrop-filter: none;
           border-radius: 28px;
           border: 1px solid rgba(110, 53, 232, 0.18);
           transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease, box-shadow 0.45s ease;
           position: relative;
           overflow: hidden;
           box-shadow: 0 10px 24px rgba(110, 53, 232, 0.08);
        }
        .profile-page .glass-card::before { content: none; }
        .profile-page .glass-card:hover {
           border-color: rgba(122, 35, 229, 0.32);
           transform: translateY(-2px);
           box-shadow: 0 16px 32px rgba(110, 53, 232, 0.12);
        }
        .profile-page .font-headline {
          letter-spacing: -0.045em;
          text-shadow: none;
        }
        .profile-page .profile-cv-section-heading {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--pf-purple-deep);
          padding-bottom: 0.35rem;
          border-bottom: 3px solid var(--pf-lime);
          line-height: 1.2;
        }
        .profile-page .profile-cv-accordion-list {
          display: flex;
          flex-direction: column;
        }
        .profile-page .profile-cv-accordion-item {
          border-bottom: 1px solid rgba(110, 53, 232, 0.1);
        }
        .profile-page .profile-cv-accordion-item--split {
          border-bottom: 1px solid rgba(110, 53, 232, 0.22);
          margin-bottom: 0.15rem;
        }
        .profile-page .profile-cv-accordion-trigger {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.1rem 0;
          text-align: left;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        .profile-page .profile-cv-accordion-trigger:hover {
          opacity: 0.82;
        }
        .profile-page .profile-cv-accordion-chevron {
          color: var(--pf-purple-dark);
          transition: transform 0.25s ease;
        }
        .profile-page .profile-cv-accordion-chevron.is-open {
          transform: rotate(180deg);
        }
        .profile-page .profile-cv-accordion-panel {
          padding: 0 0 1.25rem;
        }
        .profile-page .profile-cv-static-section {
          padding: 0 0 1.35rem;
          border-bottom: 1px solid rgba(110, 53, 232, 0.1);
        }
        .profile-page .profile-cv-static-body {
          margin-top: 0.85rem;
        }
        .profile-page .profile-accent-lime { color: var(--pf-lime-dark); }
        .profile-page .profile-accent-purple { color: var(--pf-purple-dark); }
        .profile-page .glow-halo { position: relative; display: flex; align-items: center; justify-content: center; }
        .profile-page .glow-halo::after {
           content: '';
           position: absolute;
           width: 150%;
           height: 150%;
           background: radial-gradient(circle, rgba(180,245,0,0.28) 0%, rgba(110,53,232,0.18) 45%, transparent 70%);
           border-radius: 50%;
           z-index: -1;
           animation: pulse-halo 3.2s ease-in-out infinite;
        }
        @keyframes pulse-halo {
           0%, 100% { transform: scale(1); opacity: 0.55; }
           50% { transform: scale(1.15); opacity: 0.95; }
        }
        .profile-page .input-glass {
           background: #ffffff;
           border: 1px solid rgba(110, 53, 232, 0.2);
           border-radius: 14px;
           color: var(--pf-purple-deep);
           padding: 12px 16px;
           font-size: 0.875rem;
           font-weight: 500;
           letter-spacing: -0.01em;
           transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .profile-page .input-glass:focus {
           background: #ffffff;
           border-color: rgba(122, 35, 229, 0.5);
           outline: none;
           box-shadow: 0 0 0 2px rgba(180, 245, 0, 0.25);
        }
        .profile-page .input-glass:disabled { opacity: 0.55; cursor: not-allowed; }
        .profile-page .input-glass::placeholder { color: rgba(45, 27, 105, 0.4); }
        .profile-page .profile-btn-purple {
          background: var(--pf-purple-dark);
          color: #ffffff;
          box-shadow: 0 10px 28px rgba(122, 35, 229, 0.28);
        }
        .profile-page .profile-btn-lime {
          background: var(--pf-lime);
          color: var(--pf-purple-deep);
          box-shadow: 0 10px 24px rgba(180, 245, 0, 0.28);
        }
        .profile-page .profile-toast-purple {
          background: var(--pf-purple);
          border-color: rgba(139, 77, 255, 0.45);
          color: #ffffff;
        }
        .profile-page .profile-toast-lime {
          background: var(--pf-lime);
          border-color: rgba(180, 245, 0, 0.5);
          color: var(--pf-purple-deep);
        }
        .profile-page .profile-glass-danger:hover {
          transform: none;
          border-color: rgba(110, 53, 232, 0.4);
          box-shadow: 0 16px 40px rgba(110, 53, 232, 0.15);
        }
      `}</style>
      <div className="profile-page relative z-10 mx-auto max-w-6xl px-6 pb-8 pt-8 sm:px-8 sm:pt-10">
        <div className="profile-divider mb-10 border-b pb-10 md:mb-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="min-w-0 flex-1">
            <h1 className="font-headline app-page-title mb-0">
              Hồ sơ cá nhân
            </h1>
          </div>
          </div>
        </div>

        {mentorApplyError && !isMentor && (
          <div className="profile-banner-info mb-6 flex gap-3 rounded-2xl px-4 py-3 text-sm font-medium">
            <AlertTriangle size={18} className="profile-accent-purple mt-0.5 shrink-0" />
            <p>{mentorApplyError}</p>
          </div>
        )}

        {/* Status messages */}
        {saveMsg === "avatar" && (
          <div className="profile-toast-purple fixed bottom-10 right-10 z-50 flex items-center gap-4 px-8 py-5 rounded-2xl shadow-2xl border font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-bottom-5">
            <div className="rounded-full bg-[#B4F500] p-1 text-[#2D1B69]">
              <Check size={14} />
            </div>
            Đã cập nhật ảnh đại diện
          </div>
        )}
        {saveMsg === "saved" && (
          <div className="profile-toast-lime fixed bottom-10 right-10 z-50 flex items-center gap-3 px-8 py-4 rounded-2xl shadow-2xl border font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-bottom-5">
            <Check size={18} /> Đã cập nhật thành công
          </div>
        )}
        {saveMsg === "mentor_applied" && (
          <div className="profile-toast-purple fixed bottom-10 right-10 z-50 flex max-w-md items-center gap-4 px-8 py-5 rounded-2xl shadow-2xl border font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-bottom-5">
            <div className="rounded-full bg-[#B4F500] p-1 text-[#2D1B69]"><Check size={14} /></div>
            <div>
              <p>Hồ sơ đã được gửi!</p>
              <p className="mt-1 text-[9px] font-medium lowercase first-letter:uppercase text-white/85">Hệ thống sẽ phản hồi kết quả trong vòng 24-48 giờ làm việc.</p>
            </div>
          </div>
        )}
        {saveMsg === "mentor_resubmitted" && (
          <div className="profile-toast-lime fixed bottom-10 right-10 z-50 flex max-w-md items-center gap-4 px-8 py-5 rounded-2xl shadow-2xl border font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-bottom-5">
            <div className="rounded-full bg-[#7a23e5] p-1 text-white"><Check size={14} /></div>
            <div>
              <p>Đã gửi duyệt lại hồ sơ mentor!</p>
              <p className="mt-1 text-[9px] font-semibold lowercase first-letter:uppercase opacity-80">Admin sẽ xem xét lại hồ sơ của bạn trong thời gian sớm nhất.</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-10">
            <div className="glass-card p-10 text-center">
               <div className="glow-halo relative mx-auto mb-8 w-fit">
                  <div className="w-32 h-32 rounded-[34px] bg-[#f8f5ff] border-[3px] border-[#7a23e5] overflow-hidden flex items-center justify-center text-[2.3rem] font-black text-[#7a23e5] shadow-[0_10px_24px_rgba(122,35,229,0.25)]">
                     {avatarUrl ? (
                       <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                     ) : (
                       initials
                     )}
                  </div>
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#6E35E8] text-white shadow-lg transition hover:scale-105 disabled:opacity-60"
                    title="Đổi ảnh đại diện"
                  >
                    <Camera size={18} />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
               </div>
               
               <h2 className="mb-1 text-2xl font-black tracking-tight sm:text-3xl">{form.name || "Người dùng"}</h2>
               <p className="profile-muted mb-6 text-[10px] font-bold uppercase tracking-[0.2em]">{planInfo.name}</p>
               
               {!isMentor && (
                 <div className="profile-divider pt-8 border-t">
                    <button
                      type="button"
                      disabled={applying}
                      onClick={handleSidebarMentorRegister}
                      className="profile-banner-lime group flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all hover:brightness-95 disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Lightning size={18} className="profile-accent-purple" />
                        <span className="profile-accent-purple text-[10px] font-black uppercase tracking-widest">
                          Đăng ký làm Mentor
                        </span>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#7a23e5]">
                        <CaretRight size={16} />
                      </span>
                    </button>
                 </div>
               )}
            </div>

            <div className="glass-card p-8">
               <h3 className="profile-muted mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <TrendUp size={14} className="profile-accent-purple" strokeWidth={2} /> Thống kê vận hành
               </h3>
               <div className="grid grid-cols-2 gap-6">
                  {STATS.map((stat, i) => (
                    <div key={i}>
                       <p className="profile-muted mb-2 text-[9px] font-bold uppercase leading-none tracking-wide">{stat.label}</p>
                       <p className="text-xl font-black tracking-tighter" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                  ))}
               </div>
            </div>

          </div>

          <div className="lg:col-span-8 space-y-10">
            <div id="profile-cv" className="glass-card scroll-mt-28 p-8 sm:p-10">
              <div className="profile-divider mb-8 border-b pb-6">
                <h2 className="font-headline flex items-center gap-3 text-xl font-black tracking-tight sm:text-2xl">
                  <User size={20} className="profile-accent-purple" strokeWidth={2} />
                  Hồ sơ <span className="profile-accent-lime">cá nhân</span>
                </h2>
                <p className="profile-muted mt-2 text-sm">{PROFILE_CV_MENTOR_HINT}</p>
              </div>

              <div className="profile-cv-accordion-list">
                <ProfileCvStaticSection title="Liên hệ tài khoản" showDividerBelow>
                  <div className="grid gap-6 md:grid-cols-3">
                    {FORM_FIELDS.map(({ label, key, icon: Icon }) => (
                      <div key={key} className="space-y-3">
                        <label className="profile-muted flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
                          <Icon size={12} /> {label}
                        </label>
                        <input
                          disabled={!profileCanEdit}
                          className="input-glass w-full disabled:cursor-not-allowed disabled:opacity-70"
                          value={form[key]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          placeholder={profileCanEdit ? `Nhập ${label.toLowerCase()}...` : "Dữ liệu trống"}
                        />
                      </div>
                    ))}
                  </div>
                </ProfileCvStaticSection>

                <ProfileCvAccordionSection
                  title="Giới thiệu bản thân"
                  isOpen={openCvSections.intro}
                  onToggle={() => toggleCvSection("intro")}
                >
                  <ProfileCvTextarea
                    disabled={!profileCanEdit}
                    placeholder="Giới thiệu thế mạnh, mục tiêu nghề nghiệp và lý do muốn làm Mentor..."
                    value={cvProfile.intro}
                    onChange={(e) => {
                      setMentorApplyError("");
                      setCvProfile({ ...cvProfile, intro: e.target.value });
                    }}
                    rows={5}
                  />
                </ProfileCvAccordionSection>

                <ProfileCvAccordionSection
                  title="Kinh nghiệm làm việc"
                  isOpen={openCvSections.work}
                  onToggle={() => toggleCvSection("work")}
                >
                  <ProfileWorkHistoryEditor
                    disabled={!profileCanEdit}
                    entries={cvProfile.workHistory}
                    onChange={(workHistory) => {
                      setMentorApplyError("");
                      setCvProfile(syncCvFromWorkHistory({ ...cvProfile, workHistory }));
                    }}
                  />
                  <div className="mt-4 max-w-xs">
                    <label className="profile-muted mb-2 block text-[10px] font-bold uppercase tracking-[0.18em]">
                      Tổng số năm kinh nghiệm (tùy chọn)
                    </label>
                    <input
                      disabled={!profileCanEdit}
                      type="number"
                      min={0}
                      className="input-glass w-full disabled:cursor-not-allowed disabled:opacity-70"
                      placeholder="Tự tính từ thời gian nếu để trống"
                      value={cvProfile.yearsOfExperience}
                      onChange={(e) => {
                        setMentorApplyError("");
                        setCvProfile({ ...cvProfile, yearsOfExperience: e.target.value });
                      }}
                    />
                  </div>
                </ProfileCvAccordionSection>

                <ProfileCvAccordionSection
                  title="Quá trình học tập"
                  isOpen={openCvSections.education}
                  onToggle={() => toggleCvSection("education")}
                >
                  <ProfileCvTextarea
                    disabled={!profileCanEdit}
                    placeholder="Trường, chuyên ngành, thời gian học, thành tích nổi bật..."
                    value={cvProfile.education}
                    onChange={(e) => {
                      setMentorApplyError("");
                      setCvProfile({ ...cvProfile, education: e.target.value });
                    }}
                    rows={3}
                  />
                </ProfileCvAccordionSection>

                <ProfileCvAccordionSection
                  title="Hoạt động ngoại khóa"
                  isOpen={openCvSections.extracurricular}
                  onToggle={() => toggleCvSection("extracurricular")}
                >
                  <ProfileCvTextarea
                    disabled={!profileCanEdit}
                    placeholder="Câu lạc bộ, tình nguyện, dự án cộng đồng..."
                    value={cvProfile.extracurricular}
                    onChange={(e) => {
                      setMentorApplyError("");
                      setCvProfile({ ...cvProfile, extracurricular: e.target.value });
                    }}
                    rows={3}
                  />
                </ProfileCvAccordionSection>

                <ProfileCvAccordionSection
                  title="Tên giải thưởng"
                  isOpen={openCvSections.awards}
                  onToggle={() => toggleCvSection("awards")}
                >
                  <ProfileCvTextarea
                    disabled={!profileCanEdit}
                    placeholder="Các giải thưởng, huy chương, danh hiệu (cách nhau dấu phẩy hoặc mỗi dòng một mục)..."
                    value={cvProfile.awards}
                    onChange={(e) => {
                      setMentorApplyError("");
                      setCvProfile({ ...cvProfile, awards: e.target.value });
                    }}
                    rows={2}
                  />
                </ProfileCvAccordionSection>

                <ProfileCvAccordionSection
                  title="Kỹ năng & chứng chỉ"
                  isOpen={openCvSections.skills}
                  onToggle={() => toggleCvSection("skills")}
                >
                  <ProfileCvTextarea
                    disabled={!profileCanEdit}
                    placeholder="Kỹ năng chuyên môn, chứng chỉ (VD: React, AWS, PMP...)"
                    value={cvProfile.skillsCerts}
                    onChange={(e) => {
                      setMentorApplyError("");
                      setCvProfile({ ...cvProfile, skillsCerts: e.target.value });
                    }}
                    rows={3}
                  />
                </ProfileCvAccordionSection>

                {!isMentor && (
                  <ProfileCvAccordionSection
                    title="Thông tin đăng ký mentor"
                    isOpen={openCvSections.mentorExtra}
                    onToggle={() => toggleCvSection("mentorExtra")}
                  >
                    <input
                      disabled={!profileCanEdit}
                      type="text"
                      inputMode="numeric"
                      className="input-glass w-full max-w-md"
                      placeholder="Mức phí mong muốn (VNĐ / 60 phút)"
                      value={cvProfile.targetRate}
                      onChange={(e) =>
                        setCvProfile({ ...cvProfile, targetRate: e.target.value.replace(/\D/g, "") })
                      }
                    />
                  </ProfileCvAccordionSection>
                )}

                {profileCanEdit && (
                  <div className="profile-divider border-t pt-8">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveProfile}
                      className="profile-btn-purple flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                      ) : (
                        <>
                          <Check size={14} /> Cập nhật hồ sơ
                        </>
                      )}
                    </button>
                  </div>
                )}

              </div>
            </div>

            {mentorProfile && (
              <div className="glass-card p-10">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="font-headline flex items-center gap-3 text-xl font-black tracking-tight sm:text-2xl">
                    <Briefcase size={20} className="profile-accent-purple" strokeWidth={2} /> Hồ sơ mentor
                  </h2>
                  {mentorReviewStatus === "pending" ? (
                    <span className="profile-badge-pending rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                      Đang chờ duyệt
                    </span>
                  ) : mentorReviewStatus === "approved" ? (
                    <span className="profile-badge-approved rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                      Đã duyệt
                    </span>
                  ) : mentorReviewStatus === "rejected" ? (
                    <span className="profile-badge-rejected rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                      Đã từ chối
                    </span>
                  ) : null}
                </div>
                {mentorProfile?.adminReview?.status === "rejected" && mentorProfile?.adminReview?.reason ? (
                  <div className="profile-banner-lime mb-8 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="profile-accent-purple mt-0.5 shrink-0" />
                      <div>
                        <p className="profile-accent-purple text-xs font-black uppercase tracking-widest">
                          Hồ sơ từng bị từ chối
                        </p>
                        <p className="mt-2 text-sm font-semibold">Lý do gần nhất từ admin:</p>
                        <p className="profile-muted mt-1 text-sm leading-relaxed">{mentorProfile.adminReview.reason}</p>
                        <p className="profile-muted mt-2 text-[11px]">
                          Chỉnh sửa hồ sơ phía trên, rồi bấm <strong>Đăng ký làm Mentor</strong> ở cột trái để gửi lại.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                <p className="profile-muted mb-6 text-sm">
                  Chỉnh sửa hồ sơ trong khối <strong>Hồ sơ cá nhân</strong> phía trên, rồi bấm <strong>Cập nhật hồ sơ</strong>.
                </p>
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    { label: "Chức danh mentor", key: "title" },
                    { label: "Công ty", key: "company" },
                    { label: "Năm kinh nghiệm", key: "yearsOfExperience", type: "number" },
                    { label: "Mức phí / giờ (VNĐ)", key: "targetRate", type: "number" },
                    { label: "Kỹ năng (cách nhau dấu phẩy)", key: "skillsCerts" },
                    { label: "Phản hồi trung bình", key: "responseTime" },
                    { label: "Múi giờ", key: "timezone" },
                  ].map((field) => (
                    <div key={field.key} className="space-y-3">
                      <label className="profile-muted text-[10px] font-bold uppercase tracking-[0.18em]">{field.label}</label>
                      <input
                        disabled={!profileCanEdit}
                        type={field.type || "text"}
                        className="input-glass w-full"
                        value={cvProfile[field.key] || ""}
                        onChange={(e) => setCvProfile({ ...cvProfile, [field.key]: e.target.value })}
                        placeholder={profileCanEdit ? `Nhập ${field.label.toLowerCase()}...` : "Dữ liệu trống"}
                      />
                    </div>
                  ))}
                </div>
                {mentorProfile?.finance?.bankAccount?.bankName && (
                  <p className="profile-muted mt-6 text-xs">
                    Tài khoản nhận tiền hiện tại: {mentorProfile.finance.bankAccount.bankName} - ****
                    {String(mentorProfile.finance.bankAccount.accountNumber || "").slice(-4)}
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </MentorPageShell>
  );
}