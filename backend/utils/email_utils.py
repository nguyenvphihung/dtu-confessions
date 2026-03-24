import random
import logging

logger = logging.getLogger(__name__)

def send_otp_email(email: str, code: str, purpose: str):
    """
    MOCK: Gửi mã OTP qua email.
    Trong production, hãy cấu hình SMTP hoặc sử dụng dịch vụ như SendGrid/Mailgun.
    """
    purpose_map = {
        "forgot_password": "khôi phục mật khẩu",
        "change_email": "thay đổi email",
        "change_password": "thay đổi mật khẩu"
    }
    
    friendly_purpose = purpose_map.get(purpose, purpose)
    
    # ASCII Art for visibility in logs
    logger.info("\n" + "="*50 + 
                f"\n[MOCK EMAIL] To: {email}" +
                f"\n[MOCK EMAIL] Subject: Mã xác nhận {friendly_purpose}" +
                f"\n[MOCK EMAIL] Body: Mã xác nhận của bạn là: {code}. Mã có hiệu lực trong 5 phút." +
                "\n" + "="*50)
    
    # Also print to stdout for immediate visibility during development
    print(f"\n[MOCK EMAIL] To: {email} | Code: {code} | Purpose: {friendly_purpose}\n")
    return True

def generate_otp():
    return "".join([str(random.randint(0, 9)) for _ in range(6)])
