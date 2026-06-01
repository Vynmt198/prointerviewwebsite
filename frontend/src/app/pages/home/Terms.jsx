import React from "react";
import { LegalDocumentLayout, LegalSection, LegalDef } from "../../components/legal/LegalDocumentLayout";

const PLATFORM_SUBTITLE = "PROINTERVIEW — NỀN TẢNG LUYỆN TẬP PHỎNG VẤN ỨNG DỤNG AI";

export function Terms() {
  return (
    <LegalDocumentLayout
      title="Điều khoản sử dụng dịch vụ"
      subtitle={PLATFORM_SUBTITLE}
      lastUpdated="Ngày 01 tháng 06 năm 2026"
    >
      <LegalSection title="1. Giới thiệu">
        <p>
          Tài liệu này quy định các điều khoản khi bạn sử dụng nền tảng ProInterview. Bằng việc truy cập, đăng ký tài
          khoản hoặc sử dụng bất kỳ tính năng nào, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ nội dung dưới
          đây.
        </p>
      </LegalSection>

      <LegalSection title="2. Định nghĩa">
        <LegalDef term="Dịch vụ:">
          Nền tảng ProInterview cung cấp luyện phỏng vấn AI, phân tích CV–JD, đặt lịch Mentor và các tính năng liên
          quan.
        </LegalDef>
        <LegalDef term="Người dùng:">
          Cá nhân đăng ký và sử dụng Dịch vụ, bao gồm khách hàng và Mentor (nếu được cấp quyền).
        </LegalDef>
        <LegalDef term="Hệ thống:">
          Ứng dụng web, API và hạ tầng kỹ thuật do ProInterview vận hành.
        </LegalDef>
      </LegalSection>

      <LegalSection title="3. Chấp thuận các điều khoản">
        <p>
          Bằng việc sử dụng ứng dụng <strong className="font-semibold text-slate-900">ProInterview</strong>, bạn đồng
          ý chịu sự ràng buộc bởi các Điều khoản Dịch vụ này. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng ngừng
          sử dụng Hệ thống ngay lập tức.
        </p>
      </LegalSection>

      <LegalSection title="4. Dịch vụ luyện phỏng vấn thử (AI)">
        <p>
          ProInterview cung cấp các buổi mô phỏng phỏng vấn thông qua trí tuệ nhân tạo (AI). Nội dung, câu hỏi, điểm
          đánh giá và các đề xuất cải thiện được tạo tự động bởi công nghệ phân tích dữ liệu.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Lưu ý quan trọng về AI:</strong> Kết quả đánh giá mang tính
          tham khảo, giúp bạn tự hoàn thiện kỹ năng và tối ưu CV. ProInterview không đảm bảo bạn sẽ vượt qua 100% các
          kỳ phỏng vấn thực tế tại doanh nghiệp.
        </p>
      </LegalSection>

      <LegalSection title="5. Kết nối Mentor 1:1 và đặt lịch">
        <p>
          Người dùng có thể đặt lịch luyện phỏng vấn 1:1 với Mentor trên Hệ thống.{" "}
          <strong className="font-semibold text-slate-900">Hủy hoặc đổi lịch</strong> phải thực hiện tối thiểu 24 giờ
          trước giờ bắt đầu. Người dùng cam kết giao tiếp văn minh, tôn trọng và không có phát ngôn vi phạm.
        </p>
      </LegalSection>

      <LegalSection title="6. Thanh toán và hoàn trả">
        <p>
          Giao dịch mua gói phân tích CV, khóa học hoặc buổi Mentor được thực hiện qua các cổng thanh toán liên kết.
          Hoàn tiền chỉ áp dụng khi Mentor chủ động hủy buổi hẹn hoặc Hệ thống gặp sự cố nghiêm trọng được xác thực.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
