# Báo cáo tính năng ProInterview — Đã xong chưa?

Báo cáo ngắn cho người không code. Không tính phần phỏng vấn AI (avatar / phòng luyện AI).

---

CHÚ THÍCH

✅ Xong — có trang, có API, dùng được (khi server và env đã cấu hình đúng).

🔧 Gần xong — có nhưng còn demo/mock, thiếu vài màn chi tiết, hoặc cần test lại.

📋 Chưa / chưa đủ — chưa làm hoặc chỉ có khung trang.

---

1. KHÁCH HÀNG (người đi xin việc)

✅ Trang chủ, bảng giá (gói Free / Pro).

✅ Đăng ký, đăng nhập, đăng nhập Google.

✅ Quên mật khẩu, đặt lại mật khẩu.

✅ Hồ sơ cá nhân, cài đặt tài khoản.

✅ Xem danh sách mentor và trang profile mentor.

✅ Đặt lịch mentor (booking): chọn ngày giờ, tạo đơn.

✅ Thanh toán chuyển khoản: QR, mã PI, SePay tự khớp, có trang thanh toán thành công.

🔧 MoMo / ZaloPay / thẻ — có code sandbox, không phải kênh chính trên sản phẩm.

🔧 Chi tiết buổi hẹn — phần lớn API thật, vài thông tin còn demo.

✅ Đánh giá mentor sau buổi.

✅ Danh sách lịch hẹn của tôi.

✅ Phân tích CV + JD (cần server + dịch vụ phân tích chạy).

✅ Phân tích CV theo ngành.

✅ Lịch sử phân tích CV.

✅ Xem danh sách khóa học, chi tiết khóa.

✅ Mua khóa / ghi danh (thanh toán CK).

✅ Học khóa online (video).

✅ Trang khóa đã mua.

📋 Trang tổng quan dashboard — hiện redirect về trang chủ, chưa có dashboard riêng cho khách.

🔧 Thông báo trên app — backend có, giao diện chưa gắn đầy đủ.

---

2. MENTOR

✅ Dashboard tổng quan.

✅ Quản lý lịch, slot làm việc.

✅ Tài chính, yêu cầu rút tiền.

✅ Thống kê (analytics).

✅ Xem đánh giá từ học viên.

🔧 Chi tiết buổi, phòng meeting — một phần còn mock.

✅ Tạo và sửa khóa học.

🔧 Peer review mentor — có trang, ít dùng thực tế.

---

3. ADMIN (vận hành nội bộ)

✅ Tổng quan số liệu.

✅ Quản lý user.

✅ Quản lý mentor, duyệt mentor mới.

✅ Quản lý booking.

✅ Xác nhận chuyển khoản: booking, khóa học, gói Pro.

✅ Màn thanh toán khóa và subscription.

✅ Quản lý nội dung khóa học.

✅ Reviews, hỗ trợ (support).

🔧 Chi tiết từng user — placeholder / chưa đủ.

🔧 Chi tiết từng mentor — làm một phần.

🔧 Tài chính, giao dịch, chi trả mentor — có trang, mức hoàn thiện khác nhau.

🔧 Cài đặt hệ thống — placeholder.

---

4. HẠ TẦNG (phụ thuộc khi triển khai)

✅ Website frontend (Vercel) — cần cấu hình VITE_API_URL.

✅ API backend — MongoDB, đăng nhập JWT.

✅ Dịch vụ phân tích CV (Python) — cần CV_ANALYZER_URL trên server.

✅ Chuyển khoản tự động qua SePay — cần webhook và tài khoản ngân hàng.

🔧 Upload ảnh/CV lên cloud thật — một số chỗ vẫn trả link mock.

---

5. KHÔNG NẰM TRONG BÁO CÁO NÀY

Phỏng vấn thử AI (avatar, phòng luyện, chấm điểm STAR) — vẫn có trên web, báo cáo riêng nếu cần.

Trang demo avatar — chỉ để test nội bộ.

---

6. TÓM TẮT

Phần lõi: phân tích CV, đặt mentor, thanh toán CK, khóa học, đăng nhập, admin cơ bản — ĐÃ XONG, dùng được.

Còn lẻ: dashboard khách, vài màn admin chi tiết, phòng meeting, upload production, thông báo trên UI — GẦN XONG.

---

Cập nhật theo code repo. Muốn bổ sung người test / deadline — báo team dev.
