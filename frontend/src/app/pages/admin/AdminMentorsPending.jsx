import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, Briefcase } from "lucide-react";
import { adminApi } from "../../utils/adminApi";
import { toast } from "sonner";

export function AdminMentorsPending() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingMentor, setRejectingMentor] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const loadPendingMentors = async () => {
    setLoading(true);
    const res = await adminApi.getMentors();
    if (res.success) {
      // Chỉ lấy cố vấn chờ duyệt, loại trừ hồ sơ đã bị từ chối trước đó.
      const pending = res.mentors.filter(
        (m) => !m.isActive && !m.isVerified && m?.adminReview?.status !== "rejected"
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
      setMentors(prev => prev.filter(m => m._id !== id));
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
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Duyệt đăng ký <span className="text-primary-fixed">Cố vấn</span></h2>
        <p className="text-zinc-500 text-sm font-medium">Danh sách các chuyên gia đang chờ hệ thống phê duyệt hồ sơ.</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ứng viên</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Chức danh / Công ty</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Hồ sơ</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-zinc-500 italic uppercase text-[10px] tracking-widest">Đang tải danh sách chờ...</td>
                </tr>
              ) : mentors.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-zinc-500 italic uppercase text-[10px] tracking-widest">Hiện không có hồ sơ nào đang chờ duyệt.</td>
                </tr>
              ) : (
                mentors.map((mentor) => (
                  <tr key={mentor._id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={mentor.userId?.avatar} className="w-10 h-10 rounded-xl object-cover bg-white/10" />
                        <div>
                          <p className="font-black text-white">{mentor.userId?.name}</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{mentor.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-zinc-300 font-medium lowercase first-letter:uppercase">
                        <Briefcase size={14} className="text-primary-fixed" /> {mentor.title}
                      </div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{mentor.company || 'Freelancer'}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase">
                          <FileText size={12} /> Xem CV/Cert
                       </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openRejectModal(mentor)}
                          className="p-2 rounded-xl bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all border border-red-500/10"
                        >
                          <XCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleApprove(mentor._id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
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

      {rejectingMentor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B0B1F] p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white">Từ chối hồ sơ cố vấn</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Bạn đang từ chối hồ sơ của <span className="font-semibold text-white">{rejectingMentor.userId?.name || "cố vấn"}</span>.
              Vui lòng nhập lý do để mentor biết và chỉnh sửa hồ sơ.
            </p>

            <label className="mt-5 block text-[11px] font-black uppercase tracking-widest text-zinc-400">
              Lý do từ chối
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Ví dụ: Hồ sơ còn thiếu thông tin kinh nghiệm và minh chứng chuyên môn."
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-primary-fixed"
            />
            <p className="mt-1 text-right text-[10px] text-zinc-500">{rejectReason.length}/500</p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={submittingReject}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={submittingReject}
                className="rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
