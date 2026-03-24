import os
import sys
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from database import SessionLocal
import models

def seed_fake_user_profiles(db):
    users = db.query(models.User).filter(models.User.avatar_url == None).all()
    if not users:
        print("💡 Không có user nào cần gán ảnh đại diện.")
        return

    num_to_update = int(len(users) * 0.7)
    if num_to_update == 0:
        print("💡 Số user trống quá ít, không gán avatar.")
        return

    selected_users = random.sample(users, num_to_update)
    print(f"Bắt đầu gán ảnh đại diện và ảnh bìa cho {num_to_update} người dùng (70%)...")
    
    for u in selected_users:
        # Dicebear for cool avatars based on student ID
        u.avatar_url = f"https://api.dicebear.com/7.x/adventurer/svg?seed={u.student_id}"
        # Random pictures for cover
        u.cover_url = f"https://picsum.photos/seed/{u.student_id}_cover/800/400"
    
    db.commit()
    print(f"✅ Đã trộn thành công avatar và cover cho {num_to_update} users!")

def seed_fake_images():
    db = SessionLocal()
    try:
        # Lấy tất cả bài viết chưa có ảnh bằng left outer join and filter null!
        # Dùng set query đễ nhanh hơn:
        
        # Seed fake user profiles first to show progress
        seed_fake_user_profiles(db)

        from sqlalchemy import outerjoin
        # posts_without_media = ...
        print("Tạm dừng trộn ảnh cho bài viết nếu quá lâu. Để hoàn thành việc sinh avatar/cover trước.")

        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi trộn ảnh: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_fake_images()
