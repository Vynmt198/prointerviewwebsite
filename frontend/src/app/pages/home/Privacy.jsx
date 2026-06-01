import React from "react";
import { LegalDocumentLayout, LegalSection, LegalDef } from "../../components/legal/LegalDocumentLayout";

const PLATFORM_SUBTITLE = "PROINTERVIEW — NỀN TẢNG LUYỆN TẬP PHỎNG VẤN ỨNG DỤNG AI";

export function Privacy() {
  return (
    <LegalDocumentLayout
      title="Chính sách bảo mật"
      subtitle={PLATFORM_SUBTITLE}
      lastUpdated="Ngày 01 tháng 06 năm 2026"
      intro="Chúng tôi cam kết bảo vệ toàn vẹn thông tin và hồ sơ cá nhân của bạn khi sử dụng ProInterview."
    >
      <LegalSection title="1. Giới thiệu">
        <p>
          Chính sách này mô tả cách ProInterview thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn khi truy cập và sử
          dụng Dịch vụ.
        </p>
      </LegalSection>

      <LegalSection title="2. Thông tin chúng tôi thu thập">
        <p>Để vận hành Dịch vụ, chúng tôi có thể thu thập các nhóm thông tin sau:</p>
        <LegalDef term="Thông tin tài khoản:">
          Tên hiển thị, địa chỉ email, mật khẩu (đã mã hóa an toàn).
        </LegalDef>
        <LegalDef term="Hồ sơ ứng tuyển (CV):">
          Tệp CV bạn tải lên để phân tích độ khớp với mô tả công việc (JD).
        </LegalDef>
        <LegalDef term="Dữ liệu phỏng vấn:">
          Bản ghi âm/video hoặc nội dung câu trả lời trong phòng mô phỏng để AI phân tích và phản hồi.
        </LegalDef>
      </LegalSection>

      <LegalSection title="3. Cách thức sử dụng thông tin">
        <p>Chúng tôi sử dụng thông tin cho các mục đích chính đáng sau:</p>
        <p>Vận hành thuật toán phân tích CV–JD và chấm điểm câu trả lời phỏng vấn.</p>
        <p>Đồng bộ lịch trình giữa bạn và Mentor khi đặt buổi học 1:1.</p>
        <p>Cải thiện mô hình AI nội bộ để đánh giá chính xác và tự nhiên hơn.</p>
      </LegalSection>

      <LegalSection title="4. Cam kết bảo mật">
        <LegalDef term="Mã hóa SSL/TLS:">
          Mã hóa luồng dữ liệu truyền tải giữa thiết bị của bạn và máy chủ.
        </LegalDef>
        <LegalDef term="Không bán thông tin:">
          Chúng tôi không chia sẻ hoặc thương mại hóa tài liệu CV của bạn cho bên thứ ba.
        </LegalDef>
        <p className="pt-1">
          Dữ liệu của bạn thuộc về bạn. Mọi thắc mắc về quyền riêng tư, vui lòng liên hệ qua kênh hỗ trợ chính thức
          của ProInterview.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
