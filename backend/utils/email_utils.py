import os
import random
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# Cấu hình SMTP (Lấy từ biến môi trường mặc định là theo Gmail)
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER") # Ví dụ: dtu.confessions@gmail.com
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD") # Mật khẩu ứng dụng (App Password)

def send_otp_email(email: str, code: str, purpose: str):
    """
    Gửi mã OTP thực tế qua Email (SMTP). 
    Sẽ fallback (trở về) trạng thái hiển thị log màn hình nếu chưa có SMTP_USER/PASSWORD.
    """
    purpose_map = {
        "forgot_password": "khôi phục mật khẩu",
        "change_email": "thay đổi email",
        "change_password": "thay đổi mật khẩu"
    }
    
    friendly_purpose = purpose_map.get(purpose, purpose)

    # NẾU CHƯA CONFIG BIẾN MÔI TRƯỜNG => DÙNG MOCK EMAIL
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP_USER và SMTP_PASSWORD chưa được thiết lập. Đang gửi email bằng chế độ MOCK.")
        print("\n" + "="*50)
        print(f"[MOCK EMAIL] To: {email}")
        print(f"[MOCK EMAIL] Subject: Mã xác nhận {friendly_purpose}")
        print(f"[MOCK EMAIL] MÃ OTP CỦA BẠN LÀ: {code}")
        print("="*50 + "\n")
        return True

    # NẾU CÓ CONFIG SAU => TẠO EMAIL GỬI THEO CHUẨN HTML
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Mã xác nhận {friendly_purpose} - DTU Confessions"
        msg["From"] = f"DTU Confessions <{SMTP_USER}>"
        msg["To"] = email

        # Thiết kế HTML Template email chuẩn mực và chuyên nghiệp
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #1a1a2e;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="text-align: center; border-bottom: 2px solid #e53e3e; padding-bottom: 15px; margin-bottom: 25px;">
                    <h2 style="color: #e53e3e; margin: 0; font-size: 24px;">DTU Confessions</h2>
                </div>
                
                <h3 style="color: #1a1a2e; font-size: 20px;">Xác nhận {friendly_purpose}</h3>
                <p style="font-size: 15px; line-height: 1.5; color: #4a5568;">Xin chào,</p>
                <p style="font-size: 15px; line-height: 1.5; color: #4a5568;">Bạn vừa yêu cầu <strong>{friendly_purpose}</strong>. Vui lòng sử dụng mã xác nhận bên dưới để hoàn tất quá trình xác thực:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e53e3e; background: #fff5f5; padding: 15px 40px; border-radius: 10px; border: 1px dashed #feb2b2;">
                        {code}
                    </span>
                </div>
                
                <p style="color: #718096; font-size: 14px; text-align: center;"><em>Lưu ý: Mã này có hiệu lực trong <strong>5 phút</strong>. Xin đừng chia sẻ cho ai khác.</em></p>
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 20px;">
                <p style="font-size: 12px; color: #a0aec0; text-align: center; line-height: 1.4;">
                    Nếu bạn không yêu cầu thao tác này, xin vui lòng bỏ qua email này hoặc liên hệ ban quản trị để bảo vệ tài khoản.<br>
                    &copy; 2026 DTU Confessions System.
                </p>
            </div>
        </body>
        </html>
        """

        part = MIMEText(html_content, "html")
        msg.attach(part)

        # Kết nối tới Server SMTP và Gửi
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Nâng cấp lên kết nối bảo mật (TLS)
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, email, msg.as_string())
        server.quit()
        
        logger.info(f"Đã gửi email OTP thực tế tới {email} thành công.")
        return True
    
    except Exception as e:
        logger.error(f"Lỗi khi gửi thư SMTP tới {email}: {str(e)}")
        # In thêm ra console để dễ debug nếu server gặp lỗi
        print(f"[ERROR EMAIL] Gửi email thất bại: {str(e)}")
        return False

def generate_otp():
    """Tạo ngẫu nhiên một dãy số OTP gồm 6 chữ số"""
    return "".join([str(random.randint(0, 9)) for _ in range(6)])

