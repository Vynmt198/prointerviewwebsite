import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Gửi email xác nhận tài khoản
 * @param {string} to Email người nhận
 * @param {string} name Tên người nhận
 * @param {string} verifyUrl Link xác nhận
 */
export async function sendVerificationEmail(to, name, verifyUrl) {
  const mailOptions = {
    from: process.env.MAIL_FROM || '"ProInterview" <noreply@prointerview.com>',
    to,
    subject: "Xác thực tài khoản ProInterview của bạn",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2563eb; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Chào mừng đến với ProInterview!</h1>
        </div>
        <div style="padding: 32px; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <p style="font-size: 18px; margin-top: 0;">Chào <strong>${name}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tham gia cộng đồng ProInterview. Để bắt đầu hành trình chinh phục sự nghiệp của mình, vui lòng xác nhận địa chỉ email này bằng cách nhấn vào nút bên dưới:</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Xác thực Email</a>
          </div>
          
          <p style="font-size: 14px; color: #666666;">Nếu nút trên không hoạt động, bạn có thể copy link sau và dán vào trình duyệt:</p>
          <p style="font-size: 14px; color: #2563eb; word-break: break-all;">${verifyUrl}</p>
          
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 32px 0;">
          <p style="font-size: 12px; color: #999999; text-align: center; margin-bottom: 0;">Nếu bạn không thực hiện đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { ok: true };
  } catch (error) {
    console.error("[emailService] sendVerificationEmail error:", error);
    return { ok: false, error: error.message };
  }
}

/**
 * Gửi email đặt lại mật khẩu
 * @param {string} to Email người nhận
 * @param {string} name Tên người nhận
 * @param {string} resetUrl Link đặt lại mật khẩu
 */
export async function sendResetPasswordEmail(to, name, resetUrl) {
  const mailOptions = {
    from: process.env.MAIL_FROM || '"ProInterview" <noreply@prointerview.com>',
    to,
    subject: "Đặt lại mật khẩu ProInterview",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc2626; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Đặt lại mật khẩu</h1>
        </div>
        <div style="padding: 32px; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <p style="font-size: 18px; margin-top: 0;">Chào <strong>${name}</strong>,</p>
          <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản ProInterview của bạn. Nếu là bạn, vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu mới:</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Đặt lại mật khẩu</a>
          </div>
          
          <p style="font-size: 14px; color: #666666;">Liên kết này sẽ hết hạn sau 20 phút. Nếu nút trên không hoạt động, bạn có thể copy link sau và dán vào trình duyệt:</p>
          <p style="font-size: 14px; color: #dc2626; word-break: break-all;">${resetUrl}</p>
          
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 32px 0;">
          <p style="font-size: 12px; color: #999999; text-align: center; margin-bottom: 0;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này để giữ an toàn cho tài khoản.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { ok: true };
  } catch (error) {
    console.error("[emailService] sendResetPasswordEmail error:", error);
    return { ok: false, error: error.message };
  }
}
