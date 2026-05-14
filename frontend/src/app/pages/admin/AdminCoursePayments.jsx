import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../../utils/adminApi";

export function AdminCoursePayments() {
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [enrollBusyId, setEnrollBusyId] = useState("");

  const loadPendingEnrollments = async () => {
    const res = await adminApi.getPendingEnrollmentTransfers();
    if (res.success) {
      setPendingEnrollments(res.enrollments || []);
    } else {
      toast.error(res.error || "Không tải được danh sách ghi danh chờ thanh toán chuyển khoản.");
    }
  };

  const confirmEnrollmentTransfer = async (row) => {
    const enrollmentId = row?._id;
    if (!enrollmentId) return;

    const needsOverride = !row?.transferSubmittedAt;
    let forceNote = "";
    if (needsOverride) {
      const ok = window.confirm(
        "Người dùng chưa bấm “Tôi đã chuyển khoản” (chưa có thời gian gửi xác nhận). Bạn vẫn muốn xác nhận ngoại lệ không?",
      );
      if (!ok) return;
      forceNote = String(
        window.prompt("Nhập lý do xác nhận ngoại lệ (bắt buộc):", "Đã đối soát thủ công qua sao kê ngân hàng.") || "",
      ).trim();
      if (forceNote.length < 3) {
        toast.error("Cần nhập lý do ngoại lệ tối thiểu 3 ký tự.");
        return;
      }
    }

    setEnrollBusyId(enrollmentId);
    const res = await adminApi.confirmEnrollmentTransferPayment(
      enrollmentId,
      needsOverride ? { force: true, forceNote } : {},
    );
    setEnrollBusyId("");
    if (!res.success) {
      toast.error(res.error || "Không xác nhận được thanh toán ghi danh.");
      return;
    }
    toast.success("Đã kích hoạt ghi danh khóa học.");
    setPendingEnrollments((prev) => prev.filter((e) => String(e._id) !== String(enrollmentId)));
  };

  useEffect(() => {
    void loadPendingEnrollments();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-4 flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-violet-600" />
        <div>
          <h3 className="font-headline text-2xl font-black uppercase tracking-tighter text-slate-900">
            Học phí khóa học — chờ thanh toán chuyển khoản
          </h3>
          <p className="text-sm font-medium text-slate-600">
            Duyệt chuyển khoản cho ghi danh khóa học có phí. Tách riêng khỏi lịch hẹn mentor để dễ thao tác.
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden border-slate-200/90">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Học viên</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Khóa học</th>
                <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Số tiền</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nội dung chuyển khoản</th>
                <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pendingEnrollments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500">
                    Không có ghi danh chờ xác nhận thanh toán.
                  </td>
                </tr>
              ) : (
                pendingEnrollments.map((row) => (
                  <tr key={row._id} className="transition-colors hover:bg-violet-50/40">
                    <td className="px-8 py-4">
                      <p className="font-black text-slate-900">{row.userId?.name || "—"}</p>
                      <p className="text-xs text-slate-500">{row.userId?.email || ""}</p>
                    </td>
                    <td className="px-8 py-4 font-medium text-slate-800">{row.courseId?.title || "—"}</td>
                    <td className="px-8 py-4 text-right font-black text-violet-700">
                      {(row.pricePaid ?? row.courseId?.price ?? 0).toLocaleString("vi-VN")}{" "}
                      <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">đ</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="max-w-[220px] truncate font-mono text-xs text-slate-600" title={row.paymentRef}>
                        {row.paymentRef || "—"}
                      </span>
                      {row.transferSubmittedAt ? (
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-700">
                          Đã gửi xác nhận chuyển khoản: {new Date(row.transferSubmittedAt).toLocaleString("vi-VN")}
                        </p>
                      ) : (
                        <p className="mt-1 text-[10px] text-amber-700">Chưa gửi xác nhận chuyển khoản</p>
                      )}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button
                        type="button"
                        disabled={enrollBusyId === row._id}
                        onClick={() => void confirmEnrollmentTransfer(row)}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                      >
                          {enrollBusyId === row._id ? "Đang xử lý…" : "Xác nhận đã thanh toán"}
                      </button>
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
