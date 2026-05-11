import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, Briefcase, ExternalLink } from "lucide-react";
import { adminApi } from "../../utils/adminApi";
import { toast } from "sonner";

function safeHttpUrl(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  return null;
}

function formatVnd(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return "—";
  return `${x.toLocaleString("vi-VN")} ₫`;
}

function ChipList({ items, empty }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((t) => (
        <span
          key={t}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function AdminMentorsPending() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMentor, setPreviewMentor] = useState(null);
  const [rejectingMentor, setRejectingMentor] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const loadPendingMentors = async () => {
    setLoading(true);
    const res = await adminApi.getMentors();
    if (res.success) {
      const pending = res.mentors.filter(
        (m) => !m.isActive && !m.isVerified && m?.adminReview?.status !== "rejected",
      );
      setMentors(pending);
    } else {
      toast.error(res.error || "Không thể tải danh sách hồ sơ chờ duyệt.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPendingMentors();
  }, []);

  const handleApprove = async (id) => {
    const res = await adminApi.updateMentorStatus(id, true);
    if (res.success) {
      toast.success("Đã duyệt hồ sơ cố vấn thành công!");
      setMentors((prev) => prev.filter((m) => m._id !== id));
    } else {
      toast.error(res.error || "Không thể duyệt hồ sơ cố vấn.");
    }
  };

  const openRejectModal = (mentor) => {
    setRejectingMentor(mentor);
    setRejectReason("");
  };

  const closeRejectModal = () => {
    if (submittingReject) return;
    setRejectingMentor(null);
    setRejectReason("");
  };

  const handleReject = async () => {
    const mentorId = rejectingMentor?._id;
    if (!mentorId) return;

    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Vui lòng nhập lý do từ chối hồ sơ.");
      return;
    }

    setSubmittingReject(true);
    const res = await adminApi.rejectMentorApplication(mentorId, reason);
    setSubmittingReject(false);

    if (res.success) {
      toast.success("Đã từ chối hồ sơ cố vấn.");
      setMentors((prev) => prev.filter((m) => m._id !== mentorId));
      closeRejectModal();
    } else {
      toast.error(res.error || "Không thể từ chối hồ sơ cố vấn.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="font-headline mb-2 text-3xl font-black uppercase tracking-tighter text-slate-900">
          Duyệt đăng ký <span className="text-violet-700">Cố vấn</span>
        </h2>
        <p className="text-sm font-medium text-slate-600">
          Danh sách các chuyên gia đang chờ hệ thống phê duyệt hồ sơ.
        </p>
      </div>

      <div className="glass-card overflow-hidden border-slate-200/90">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Ứng viên</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Chức danh / Công ty
                </th>
                <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Hồ sơ gửi
                </th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500">
                    Đang tải danh sách chờ...
                  </td>
                </tr>
              ) : mentors.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500">
                    Hiện không có hồ sơ nào đang chờ duyệt.
                  </td>
                </tr>
              ) : (
                mentors.map((mentor) => (
                  <tr key={mentor._id} className="group transition-colors hover:bg-violet-50/40">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img
                          src={mentor.userId?.avatar}
                          alt=""
                          className="size-10 rounded-xl bg-slate-100 object-cover"
                        />
                        <div>
                          <p className="font-black text-slate-900">{mentor.userId?.name}</p>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">{mentor.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 font-medium lowercase text-slate-700 first-letter:uppercase">
                        <Briefcase size={14} className="text-violet-600" /> {mentor.title}
                      </div>
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">
                        {mentor.company || "Freelancer"}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button
                        type="button"
                        onClick={() => setPreviewMentor(mentor)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase text-slate-600 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
                      >
                        <FileText size={12} /> Xem hồ sơ
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openRejectModal(mentor)}
                          className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition-all hover:border-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <XCircle size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(mentor._id)}
                          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-800 transition-all hover:border-emerald-400 hover:bg-emerald-600 hover:text-white"
                        >
                          <CheckCircle size={14} /> Phê duyệt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewMentor ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setPreviewMentor(null)}
        >
          <div
            role="dialog"
            aria-labelledby="admin-mentor-preview-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 id="admin-mentor-preview-title" className="text-lg font-black text-slate-900">
                Hồ sơ ứng tuyển cố vấn
              </h3>
              <button
                type="button"
                onClick={() => setPreviewMentor(null)}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Thông tin mentor gửi qua form đăng ký (không có file CV tải lên máy chủ — chỉ liên kết nếu có).
            </p>

            <div className="mt-6 flex gap-4 border-b border-slate-100 pb-6">
              <img
                src={previewMentor.userId?.avatar || "/Logo.png"}
                alt=""
                className="size-16 shrink-0 rounded-xl bg-slate-100 object-cover"
              />
              <div className="min-w-0">
                <p className="font-black text-slate-900">{previewMentor.userId?.name || previewMentor.name}</p>
                <p className="truncate text-sm text-slate-500">{previewMentor.userId?.email}</p>
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-semibold">{previewMentor.title}</span>
                  <span className="text-slate-400"> · </span>
                  {previewMentor.company || "Freelancer"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Kinh nghiệm:{" "}
                  <span className="font-medium text-slate-800">
                    {Number.isFinite(Number(previewMentor.experienceYears))
                      ? `${previewMentor.experienceYears} năm`
                      : "—"}
                  </span>
                  <span className="mx-2 text-slate-300">|</span>
                  Đề xuất giá/giờ:{" "}
                  <span className="font-medium text-slate-800">{formatVnd(previewMentor.pricePerHour)}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tiểu sử</p>
                <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-800">
                  {previewMentor.bio?.trim() || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kỹ năng / chuyên môn</p>
                <div className="mt-2">
                  <ChipList items={previewMentor.specialties} empty="Không có." />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lĩnh vực</p>
                <div className="mt-2">
                  <ChipList items={previewMentor.fields} empty="Không có." />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Công ty / lịch sử (text)</p>
                <div className="mt-2">
                  <ChipList items={previewMentor.companies} empty="Không có." />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Liên kết</p>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500">LinkedIn:</span>
                    {safeHttpUrl(previewMentor.linkedinUrl) ? (
                      <a
                        href={safeHttpUrl(previewMentor.linkedinUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:underline"
                      >
                        Mở <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Chưa cung cấp</span>
                    )}
                  </li>
                  <li className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500">Portfolio / CV online:</span>
                    {safeHttpUrl(previewMentor.portfolioUrl) ? (
                      <a
                        href={safeHttpUrl(previewMentor.portfolioUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:underline"
                      >
                        Mở <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Chưa cung cấp</span>
                    )}
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  const m = previewMentor;
                  setPreviewMentor(null);
                  openRejectModal(m);
                }}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-700 hover:bg-red-600 hover:text-white"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = previewMentor._id;
                  setPreviewMentor(null);
                  await handleApprove(id);
                }}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-800 hover:border-emerald-400 hover:bg-emerald-600 hover:text-white"
              >
                Phê duyệt
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectingMentor ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={closeRejectModal}
        >
          <div
            role="dialog"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-slate-900">Từ chối hồ sơ cố vấn</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn đang từ chối hồ sơ của{" "}
              <span className="font-semibold text-slate-900">{rejectingMentor.userId?.name || "cố vấn"}</span>. Vui lòng
              nhập lý do để mentor biết và chỉnh sửa hồ sơ.
            </p>

            <label className="mt-5 block text-[11px] font-black uppercase tracking-widest text-slate-500">
              Lý do từ chối
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Ví dụ: Hồ sơ còn thiếu thông tin kinh nghiệm và minh chứng chuyên môn."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-400"
            />
            <p className="mt-1 text-right text-[10px] text-slate-500">{rejectReason.length}/500</p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={submittingReject}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={submittingReject}
                className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-700 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingReject ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
