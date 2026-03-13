import os
import sys
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def seed_fake_images():
    db = SessionLocal()
    try:
        # Lấy tất cả bài viết
        posts = db.query(models.Post).all()
        if not posts:
            print("❌ Không có bài viết nào trong Database. Vui lòng chạy seed_fake_data.py trước!")
            return

        print(f"Bắt đầu gán ảnh cho {len(posts)} bài viết...")

        # Lọc ra các bài chưa có ảnh
        posts_without_media = []
        for p in posts:
            has_media = db.query(models.PostMedia).filter(models.PostMedia.post_id == p.id).first()
            if not has_media:
                posts_without_media.append(p)

        total_posts = len(posts_without_media)
        if total_posts == 0:
            print("Tất cả bài viết đã có ảnh.")
            return

        num_posts_with_images = int(total_posts * 0.7)
        if num_posts_with_images == 0:
            print("Không có bài viết nào cần gán ảnh (dưới 1 bài viết).")
            return

        # Chọn ngẫu nhiên 70% số post chưa có ảnh
        selected_posts = random.sample(posts_without_media, num_posts_with_images)

        added_count = 0
        for post in selected_posts:
            for i in range(2):  # Luôn gán 2 ảnh cho mỗi post được chọn
                width = random.choice([800, 1024, 1280])
                height = random.choice([600, 768, 720, 800])
                random_seed = random.randint(1, 10000)
                random_image_url = f"https://picsum.photos/seed/{random_seed}/{width}/{height}"
                media = models.PostMedia(
                    post_id=post.id,
                    file_url=random_image_url,
                    file_name=f"fake_image_{random_seed}.jpg",
                    file_size=random.randint(50000, 500000), # 50KB - 500KB fake size
                    media_type="image",
                    mime_type="image/jpeg"
                )
                db.add(media)
                added_count += 1

        db.commit()
        print(f"✅ Đã thêm thành công {added_count} ảnh (2 ảnh/post, {num_posts_with_images} post, chiếm 70% tổng số post chưa có ảnh)!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi trộn ảnh: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_fake_images()
