# Kế hoạch phát triển ProInterview (Dev) — Tháng 5 → Tháng 8

**Đối tượng:** Người xin việc ngành **IT**.  
**Căn cứ:** Bộ tính năng **đang có trên web hôm nay** (routes, menu, luồng user) — coi là **đã dev xong trong 4 tuần tháng 5**.  
**Tháng 6 trở đi:** Không “làm lại” các màn đó — chỉ harden, deploy, sửa chỗ còn mock / placeholder, vận hành.

---

## Những gì web đang có (inventory — đã xong T5)

*Danh sách theo sản phẩm thực tế, không theo file code.*

| Khu vực | Đang có trên web |
|:--------|:-----------------|
| **Shell** | Layout khách hàng (navbar, sidebar), footer, điều hướng hash router |
| **Trang chủ** | Hero + video PV, lưới 4 tính năng, “Cách hoạt động” 4 bước, showcase **CV**, **Mentor**, **Khóa học**, testimonials, CTA pricing |
| **Auth** | Đăng ký, đăng nhập, Google, quên/đặt lại mật khẩu, xác minh email |
| **Phân tích CV** | Hub chọn luồng → **CV–JD** và **CV–theo ngành (IT)** → upload/phân tích → **kết quả** → **lịch sử** |
| **Phỏng vấn AI** | Thiết lập (CV từ phân tích / upload), tạo session, **phòng PV** (avatar), **feedback**, lịch sử PV |
| **Gói & thanh toán** | Bảng giá, checkout, return / success / failure |
| **Mentor** | Danh sách mentor, hồ sơ mentor, đặt lịch, buổi hẹn của tôi, chi tiết session, đánh giá mentor sau buổi |
| **Tài khoản** | Dashboard (thống kê, buổi sắp tới, hủy lịch), hồ sơ, cài đặt |
| **Khóa học** | Danh sách, chi tiết, ghi danh/học (màn học full-screen), khóa của tôi |
| **Khu mentor** | Dashboard, lịch, tài chính, analytics, đánh giá, phòng họp, quản lý/sửa khóa, peer review, feedback buổi |
| **Admin** | Dashboard, users, mentors (+ duyệt pending), bookings, thanh toán khóa/gói, nội dung khóa, analytics, support, achievements |
| **Nội dung phụ** | About, Terms, Privacy, Blog, Achievements |

**IT:** Luồng **phân tích CV** và **phỏng vấn AI** cho ngành IT **đã chạy được** — nằm trong bảng trên, không phải backlog tháng 5/6.

---

## Tóm tắt trạng thái

| Giai đoạn | Ý nghĩa |
|:----------|:--------|
| **T5 (4 tuần)** | **Xong** — toàn bộ inventory ở trên |
| **T6 → 01/06** | Deploy ổn định, QA IT end-to-end, xử lý mock/placeholder còn sót |
| **T7–T8** | Vận hành, admin chi tiết, polish, mobile |

---

## Tháng 5 (4 tuần) — ĐÃ HOÀN THÀNH

*Phân bổ theo thứ tự build thực tế; kết quả cuối tuần 4 = web như hiện tại.*

### Tuần 1 — Nền sản phẩm + trang chủ + auth

**Mục tiêu:** Vào web là thấy ProInterview, đăng nhập được, đi được menu chính.

**Đã làm (đang có trên web):**
- Shell app: layout, sidebar customer, top nav, brand  
- **Trang chủ:** hero, 4 ô tính năng (CV / PV AI / Mentor / Khóa), section “Cách hoạt động”, animation landing  
- Trang tĩnh: About, Terms, Privacy, Blog, Achievements  
- **Auth đầy đủ:** register, login, Google, forgot/reset password, verify email  
- Routing role (customer / mentor / admin redirect)

**Kết quả:** Landing marketing + khung điều hướng; user guest và user login vào đúng khu vực.

---

### Tuần 2 — Phân tích CV + Phỏng vấn AI (IT) + Pricing

**Mục tiêu:** Hai trụ cột sản phẩm IT hoạt động trên web.

**Đã làm (đang có trên web):**
- **Hub CV** (`/cv-analysis`): chọn CV–JD hoặc CV–theo ngành  
- Luồng **CV–JD:** upload, phân tích, trang kết quả, lịch sử  
- Luồng **CV–theo ngành (IT):** upload, phân tích, kết quả, lịch sử  
- **Phỏng vấn AI:** màn thiết lập (gắn CV đã phân tích / file), tạo câu hỏi & session  
- **Phòng phỏng vấn** + **feedback** sau buổi; panel lịch sử PV  
- **Bảng giá** (`/pricing`) và hiển thị gói/quota trên UI  
- Showcase **CV** trên Home (section riêng, CTA vào hub)

**Kết quả:** IT user làm được CV → (tuỳ chọn) PV AI trên cùng một web, không cần tool ngoài.

---

### Tuần 3 — Mentor, booking, dashboard, thanh toán

**Mục tiêu:** Kênh mentor + tài khoản cá nhân.

**Đã làm (đang có trên web):**
- **Tìm mentor:** list + profile (`/mentors`, `/mentors/:id`)  
- **Đặt lịch** booking + **checkout** + luồng **payment return / success / failure**  
- **Dashboard:** thống kê API, buổi sắp tới, hủy lịch (chính sách hoàn), cảnh báo  
- **My bookings**, **chi tiết session**, **đánh giá mentor** sau buổi  
- **Profile**, **Settings**  
- Showcase **Mentor** trên Home

**Kết quả:** User IT đặt mentor, quản lý buổi hẹn và thanh toán trên một luồng thống nhất.

---

### Tuần 4 — Khóa học, khu mentor, admin, polish Home/CV hub

**Mục tiêu:** Hoàn thiện phần còn lại của sản phẩm + chỉnh UX landing.

**Đã làm (đang có trên web):**
- **Khóa học:** catalog, chi tiết, **học full-screen**, **khóa của tôi**  
- **Khu mentor:** dashboard, schedule, finance, analytics, reviews, meeting room, quản lý/sửa khóa, peer review, session feedback  
- **Admin:** users, mentors, pending, bookings, payments (khóa + subscription), content courses, analytics, support, achievements  
- **Meeting room** (user/mentor)  
- Polish **Home** (testimonials, courses showcase, spacing/zoom section)  
- Polish **hub CV** (layout 2 cột, demo kết quả, scale khi zoom)  
- Avatar demo (nội bộ / demo)

**Kết quả:** Web đủ 4 trụ: **CV · PV AI · Mentor · Khóa học** + vận hành mentor/admin — **trùng với bản đang chạy local/prod hiện tại**.

---

## Tháng 6 — Sau khi T5 đã “đủ web” (mốc 01/06)

*Chỉ việc **còn thiếu** so với bản chạy thật ổn định — không liệt kê lại build CV/PV/mentor từ đầu.*

### Tuần 1

**Mục tiêu:** QA IT trên staging/prod.

**Công việc:**
- Smoke: CV IT (field) + PV AI + dashboard + 1 booking test  
- Sửa P0 từ QA (không feature mới)  
- Mentor IT trong DB đủ để demo

---

### Tuần 2 — **Mốc 01/06**

**Mục tiêu:** Demo FPT / beta trên URL cố định.

**Công việc:**
- Deploy prod/staging ổn định (`VITE_API_URL`, `CV_ANALYZER_URL`, CORS)  
- Thanh toán CK: 1 đơn test end-to-end → quota đúng  
- Rà các chỗ còn **mock** (checkout link giả, session field demo, upload URL giả, admin placeholder) — sửa nếu chặn demo  
- Checklist 15 phút: CV → PV AI → pricing → mentor

---

### Tuần 3

**Công việc:**
- Feedback beta, thông báo in-app (booking/thanh toán)  
- Link/join buổi mentor rõ cho 2 phía  
- Khóa học: 2–3 khóa IT có nội dung tối thiểu trên prod

---

### Tuần 4

**Công việc:**
- Mentor hoàn thành buổi / xác nhận từ app mentor  
- Upload avatar/CV thumbnail thật (nếu env chưa có storage)  
- Ổn định sau sự kiện

---

## Tháng 7

### Tuần 1 — Mentor vận hành

- Lịch rảnh, chặn ngày, analytics/finance tin cậy  
- Review & payout flow

### Tuần 2 — Admin vận hành

- Duyệt mentor, xác nhận CK hàng loạt  
- Backup, support ticket

### Tuần 3 — Polish (không core mới)

- Export/copy kết quả CV, báo cáo PV chi tiết hơn  
- Lịch sử, lọc, perf trang nặng

### Tuần 4 — Bảo mật

- Auth/token/CORS prod, rate limit abuse

---

## Tháng 8

### Tuần 1 — Admin chi tiết

- Trang chi tiết user/mentor/booking (thay placeholder nếu còn)

### Tuần 2 — IT v2 (tùy chọn)

- PV theo JD đã phân tích, gợi ý câu trả lời

### Tuần 3 — Mobile & UX

- Responsive booking/pricing/dashboard  
- Onboarding lần đầu

### Tuần 4 — Bàn giao

- Runbook deploy, changelog, roadmap Q3

---

## Checklist 01/06

- [ ] Trên prod: **CV IT (field)** — upload → kết quả → history  
- [ ] Trên prod: **PV AI** — setup → room → feedback  
- [ ] Trên prod: **Mentor** — đặt lịch → thấy trên dashboard  
- [ ] Trên prod: **CK / gói** — 1 đơn test → quota  
- [ ] Demo 15 phút không P0  

---

## Họp dev

- **T5:** closed — chỉ fix bug UI/P0 nếu QA báo  
- **T6:** deploy + QA + mock cleanup — **không** sprint “làm mentor/CV mới”  
- Mọi mục trong bảng **inventory** đầu file = **đã ship T5**, không đưa lại vào plan như việc chưa làm

*Cập nhật theo web thực tế: toàn bộ tính năng đang có = 4 tuần tháng 5; T6+ = vận hành & hoàn thiện deploy.*
