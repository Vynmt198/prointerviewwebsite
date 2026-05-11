import { useState, useEffect } from "react";
import { Users, Search, Filter, CheckCircle, XCircle, Eye, ShieldCheck, Star } from "lucide-react";
import { adminApi } from "../../utils/adminApi";
import { toast } from "sonner";

export function AdminMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadMentors = async () => {
    setLoading(true);
    const res = await adminApi.getMentors();
    if (res.success) {
      const active = res.mentors.filter(
        (m) => m.isActive && m.isVerified && m.userId?.role === "mentor",
      );
      setMentors(active);
    } else {
      toast.error(res.error || "Không thể tải danh sách cố vấn.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMentors();
  }, []);

  const handleToggleActive = async (mentor) => {
    const nextStatus = !mentor.isActive;
    const res = await adminApi.updateMentorStatus(mentor._id, nextStatus);
    if (res.success) {
      toast.success(nextStatus ? "Đã duyệt cố vấn" : "Đã khóa cố vấn");
      setMentors((prev) =>
        prev.map((m) =>
          m._id === mentor._id
            ? {
                ...m,
                isActive: nextStatus,
                isVerified: nextStatus ? true : m.isVerified,
              }
            : m,
        ),
      );
    } else {
      toast.error(res.error || "Không thể cập nhật trạng thái cố vấn.");
    }
  };

  const filtered = mentors.filter(
    (m) =>
      m.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="font-headline mb-2 text-3xl font-black uppercase tracking-tighter text-slate-900">
            Quản lý <span className="text-violet-700">Cố vấn</span>
          </h2>
          <p className="text-sm font-medium text-slate-600">Danh sách toàn bộ cố vấn trên hệ thống ProInterview.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-6 text-sm text-slate-900 outline-none transition-all focus:border-violet-400 md:w-64"
            />
          </div>
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden border-slate-200/90">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Cố vấn</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Chuyên môn</th>
                <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Trạng thái
                </th>
                <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Đánh giá
                </th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center italic text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center italic text-slate-500">
                    Không tìm thấy cố vấn nào.
                  </td>
                </tr>
              ) : (
                filtered.map((mentor) => (
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
                          <p className="text-[10px] text-slate-500">{mentor.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-medium text-slate-700">{mentor.title}</p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">{mentor.company}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        {mentor.isActive ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
                            <CheckCircle size={10} /> Hoạt động
                          </span>
                        ) : mentor.isVerified ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase text-red-700">
                            <XCircle size={10} /> Đã khóa
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase text-orange-800">
                            <XCircle size={10} /> Chờ duyệt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-1 text-amber-500">
                        <Star size={12} className="fill-current" />
                        <span className="font-black text-slate-900">{mentor.rating || "0.0"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(mentor)}
                          className={`rounded-xl border p-2 transition-all ${
                            mentor.isActive
                              ? "border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-600 hover:text-white"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-600 hover:text-white"
                          }`}
                          title={mentor.isActive ? "Khóa" : "Duyệt"}
                        >
                          <ShieldCheck size={16} />
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Eye size={16} />
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
    </div>
  );
}
