# Giỏ hàng nhiều khóa và rà soát booking quá giờ

Nguồn tham khảo: [BookingMentorPlatform, commit 9a5a8ed](https://github.com/Vynmt198/BookingMentorPlatform/tree/9a5a8ed/ProInterview).
Job được điều chỉnh từ `backend/src/jobs/bookingStaleSweepJob.js`; nghiệp vụ cart tham khảo `cartController.js`, model Cart và giao diện giỏ của nguồn, triển khai theo cấu trúc API hiện tại của ProInterview.

## Luồng sử dụng

1. Học viên chọn **Thêm vào giỏ** trên danh sách/chi tiết khóa học.
2. Mở biểu tượng giỏ hàng hoặc `/cart`. Giỏ lưu theo tài khoản trong MongoDB.
3. Bấm **Thanh toán giỏ hàng**, nhập coupon nếu có. Server tính giá Pro/Elite và coupon, tạo một đơn cùng mã PI cho tối đa 20 khóa.
4. Chuyển đúng tổng tiền/nội dung QR. SePay xác nhận toàn đơn; admin có thể đối soát thủ công tại **Học phí khóa học**, hộp xác nhận hiển thị số khóa và tổng đơn.
5. Các khóa được mở quyền học và ghi nhận doanh thu theo từng enrollment; chỉ xóa các khóa đã mua khỏi giỏ. Khóa mới thêm vẫn ở lại.

Mỗi tài khoản có tối đa một đơn giỏ đang xử lý. Đơn đã tạo giữ nguyên tổng tiền và danh sách, kể cả khi người dùng sửa giỏ hoặc giá khóa thay đổi.
Đơn hết hạn không được nhận tiền tự động; xóa các ghi danh đang chờ của đơn, hủy ledger pending và giữ giỏ để tạo lại.
Khóa đang có đơn mua lẻ chưa hết hạn phải hoàn tất đơn đó trước khi đưa vào checkout chung.

## Tương thích dữ liệu hiện tại

- Collections mới: `carts`, `cart_orders`; trường mới trên Enrollment: `cartOrderId`; Booking: `staleFlaggedAt`.
- Giữ index unique của `Enrollment.paymentRef`, bằng mã riêng có hậu tố cho từng khóa; `CartOrder.orderRef` sở hữu mã QR chung.
- Thanh toán ghi một ledger trên mỗi enrollment, tránh cộng doanh thu hai lần.
- Trạng thái đã nhận tiền được lưu trước khi mở quyền học; lỗi giữa chừng được tiếp tục khi webhook gửi lại hoặc học viên mở lại đơn. Không xác nhận số tiền chỉ bằng phần khóa chưa mở còn lại.
- Endpoint xác nhận enrollment cũ từ chối đơn giỏ để admin không vô tình xác nhận cả đơn dựa vào giá một khóa.
- Dùng cấu hình ngân hàng và SePay hiện có; không thêm dependency hoặc yêu cầu đổi bộ cấu hình thanh toán.
- MongoDB tạo collection/index mới theo cấu hình Mongoose hiện tại. Nếu môi trường tắt `autoIndex`, cần tạo index của Cart/CartOrder theo schemas trước khi bật checkout.

## Rà soát booking

Chạy ngay khi kết nối DB và sau mỗi 20 phút. Booking pending với paymentStatus pending/failed quá giờ bắt đầu được hủy và cập nhật ledger chờ. Booking đã trả tiền, còn pending/confirmed/in_progress, quá giờ kết thúc cộng 60 phút được đánh dấu, thông báo học viên/mentor/admin. Không tự xử lý hoàn tiền hoặc kết luận bên nào vắng mặt.
Admin xem bộ lọc **Quá giờ cần rà soát** hoặc liên kết trong thông báo. Các cập nhật có điều kiện tránh quét trùng, gửi thông báo lặp hoặc thay đổi buổi đã hoàn tất.

## Kiểm thử

`cd backend` rồi `npm run test:cart` chạy test HTTP với MongoDB tạm: giá server và ưu đãi, chống trùng, quyền sở hữu, một chuyển khoản nhiều khóa, admin xác nhận toàn đơn, hết hạn, coupon/free course, xung đột đơn mua lẻ, tiếp tục sau lỗi, job quá giờ và thông báo không lặp.
`npm run test:node` gồm bộ test mới và regression hiện có; `cd frontend && npm test` và `npm run build` kiểm tra frontend.
